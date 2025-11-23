"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSpData = readSpData;
exports.getTasks = getTasks;
const promises_1 = __importDefault(require("node:fs/promises"));
async function readSpData(spBackupPath) {
    const raw = await promises_1.default.readFile(spBackupPath, 'utf8');
    return JSON.parse(raw);
}
function getTasks(sp) {
    return sp.task.ids.map((id) => sp.task.entities[id]);
}
