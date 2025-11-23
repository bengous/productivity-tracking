"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("node:fs/promises");
const gcal_client_1 = require("./gcal-client");
const sp_reader_1 = require("./sp-reader");
const mapper_1 = require("./mapper");
const path_1 = __importDefault(require("path"));
async function main() {
    // Load Config
    const configPath = path_1.default.resolve(__dirname, '../config.sp-gcal.json');
    const configRaw = await (0, promises_1.readFile)(configPath, 'utf8');
    const config = JSON.parse(configRaw);
    // 1. Read SP Data
    const spBackupPath = path_1.default.resolve(__dirname, config.spBackupPath);
    console.log(`Reading Brain from: ${spBackupPath}`);
    const sp = await (0, sp_reader_1.readSpData)(spBackupPath);
    const tasks = (0, sp_reader_1.getTasks)(sp);
    console.log(`Loaded ${tasks.length} tasks.`);
    // 2. Map to Events
    const candidates = tasks.flatMap((t) => (0, mapper_1.mapTaskToEvents)(t, config.google.timeZone));
    console.log(`Identified ${candidates.length} syncable events (Planned, Deadlines, or Worklog).`);
    if (candidates.length === 0) {
        console.log("Nothing to sync.");
        return;
    }
    // 3. Authenticate
    let auth = await (0, gcal_client_1.getAuthClient)(config);
    // If no credentials set on the client, we need to authorize
    if (!auth.credentials || !auth.credentials.access_token) {
        auth = await (0, gcal_client_1.authorizeNewUser)(auth);
    }
    // 4. Sync
    await (0, gcal_client_1.upsertEvents)(auth, config.google.calendarId, candidates);
}
main().catch((e) => {
    console.error("\n❌ Fatal Error:", e);
    process.exit(1);
});
