"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = void 0;
const dbConfig_1 = __importDefault(require("../config/dbConfig"));
const drizzle_orm_1 = require("drizzle-orm");
const testConnection = async () => {
    try {
        const result = await dbConfig_1.default.execute((0, drizzle_orm_1.sql) `SELECT 1 as connected`);
        console.log('✅ Database connected successfully');
        return result;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
};
exports.testConnection = testConnection;
