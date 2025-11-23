"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthClient = getAuthClient;
exports.authorizeNewUser = authorizeNewUser;
exports.upsertEvents = upsertEvents;
const googleapis_1 = require("googleapis");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
async function loadJSON(p) {
    try {
        return JSON.parse(await promises_1.default.readFile(p, 'utf8'));
    }
    catch (e) {
        return null;
    }
}
async function getAuthClient(config) {
    const credentialsPath = node_path_1.default.resolve(process.cwd(), config.google.credentialsPath);
    const credentials = await loadJSON(credentialsPath);
    if (!credentials) {
        throw new Error(`Could not read credentials file at ${credentialsPath}`);
    }
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new googleapis_1.google.auth.OAuth2(client_id, client_secret, redirect_uris ? redirect_uris[0] : 'http://localhost');
    const tokenPath = node_path_1.default.resolve(process.cwd(), config.google.tokenPath);
    const token = await loadJSON(tokenPath);
    if (token) {
        oAuth2Client.setCredentials(token);
        return oAuth2Client;
    }
    else {
        // Return client without credentials to trigger auth flow
        return oAuth2Client;
    }
}
async function authorizeNewUser(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('\n⚠️  Authorization Required ⚠️');
    console.log('1. Visit this URL to authorize the app:');
    console.log(`   ${authUrl}`);
    console.log('2. After authorizing, you will be redirected to localhost (which might fail).');
    console.log('3. Copy the "code" parameter from the URL in your browser address bar.');
    console.log('   (e.g. ?code=4/0A...)');
    console.log('\nPaste the code here:');
    // Reading from stdin is handled in the CLI entrypoint or here.
    // For simplicity, we return the client and let the CLI handle the input if we want interactive.
    // But to keep it self-contained, we can use readline here.
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve, reject) => {
        readline.question('> ', async (code) => {
            readline.close();
            try {
                const { tokens } = await oAuth2Client.getToken(code);
                oAuth2Client.setCredentials(tokens);
                // Save tokens
                await promises_1.default.writeFile('token.json', JSON.stringify(tokens));
                console.log('Token stored to token.json');
                resolve(oAuth2Client);
            }
            catch (err) {
                reject(err);
            }
        });
    });
}
async function upsertEvents(auth, calendarId, candidates) {
    const calendar = googleapis_1.google.calendar({ version: 'v3', auth });
    console.log(`Fetching existing events from calendar: ${calendarId}...`);
    // 1. Fetch existing future events to avoid duplicates.
    // We use the 'privateExtendedProperty' filter to only get events created by this tool.
    // Note: 'privateExtendedProperty' filtering is powerful but limited in number of terms.
    // Here we just ask for anything with our key. 
    // Actually, the list API requires 'key=value' or just 'key'.
    let existingEvents = [];
    try {
        const listResponse = await calendar.events.list({
            calendarId,
            privateExtendedProperty: ['spTaskId'],
            maxResults: 2500,
            singleEvents: true, // Expand recurring events
        });
        existingEvents = listResponse.data.items || [];
    }
    catch (e) {
        console.error("Error listing events. Ensure Calendar API is enabled and Calendar ID is correct.");
        throw e;
    }
    const existingMap = new Map(); // Map: spTaskId -> googleEventId
    for (const evt of existingEvents) {
        if (evt.extendedProperties?.private?.spTaskId) {
            existingMap.set(evt.extendedProperties.private.spTaskId, evt.id);
        }
    }
    console.log(`Found ${existingEvents.length} tracked events.`);
    // 2. Upsert (Update or Insert)
    let created = 0;
    let updated = 0;
    for (const c of candidates) {
        const body = {
            summary: c.summary,
            description: c.description,
            extendedProperties: {
                private: {
                    spTaskId: c.taskId,
                    spDay: c.day,
                },
            },
        };
        if (c.allDay) {
            body.start = { date: c.day };
            body.end = { date: c.day };
        }
        else if (c.start && c.end) {
            body.start = { dateTime: c.start.toISOString(), timeZone: 'Europe/Paris' };
            body.end = { dateTime: c.end.toISOString(), timeZone: 'Europe/Paris' };
        }
        const existingId = existingMap.get(c.taskId);
        try {
            if (existingId) {
                // UPDATE existing event
                // Optimization: Only update if something changed? For now, always patch to be safe.
                await calendar.events.patch({
                    calendarId,
                    eventId: existingId,
                    requestBody: body,
                });
                process.stdout.write('.');
                updated++;
            }
            else {
                // INSERT new event
                await calendar.events.insert({
                    calendarId,
                    requestBody: body,
                });
                process.stdout.write('+');
                created++;
            }
        }
        catch (e) {
            console.error(`\nFailed to process task ${c.taskId}:`, e);
        }
    }
    console.log(`\nSync Complete: ${created} created, ${updated} updated.`);
}
