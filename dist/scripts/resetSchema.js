"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dbConfig_1 = __importDefault(require("../config/dbConfig"));
const drizzle_orm_1 = require("drizzle-orm");
const reset = async () => {
    try {
        console.log('Dropping schema...');
        await dbConfig_1.default.execute((0, drizzle_orm_1.sql) `DROP SCHEMA public CASCADE;`);
        await dbConfig_1.default.execute((0, drizzle_orm_1.sql) `CREATE SCHEMA public;`);
        await dbConfig_1.default.execute((0, drizzle_orm_1.sql) `GRANT ALL ON SCHEMA public TO public;`);
        console.log('Schema reset successfully.');
    }
    catch (e) {
        console.error(e);
    }
    process.exit(0);
};
reset();
