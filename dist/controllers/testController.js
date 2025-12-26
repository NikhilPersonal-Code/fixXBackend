"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepopulateData = exports.getAnything = exports.test = exports.getUsers = void 0;
const dbConfig_1 = __importDefault(require("../config/dbConfig"));
const drizzle_orm_1 = require("drizzle-orm");
const tables_1 = require("../db/tables");
const getUsers = async (req, res) => {
    const rows = await dbConfig_1.default.query.users.findMany();
    res.json({ users: rows });
};
exports.getUsers = getUsers;
const test = async (req, res) => {
    res.json({ users: 'this is local test endpoint', status: 'ok' });
};
exports.test = test;
const getAnything = async (req, res) => {
    if (!req.body.query) {
        return res.status(400).json({ message: 'No query provided' });
    }
    console.log(req.body);
    const rows = await dbConfig_1.default.execute(drizzle_orm_1.sql.raw(req.body.query));
    res.json({ data: rows.rows });
};
exports.getAnything = getAnything;
const prepopulateData = async (req, res) => {
    dbConfig_1.default.insert(tables_1.categories).values([
        { categoryName: 'Cleaning' },
        { categoryName: 'Handy person' },
        { categoryName: 'Assembly' },
        { categoryName: 'Transport and Removals' },
        { categoryName: 'Rrepairs' },
        { categoryName: 'Painting' },
        { categoryName: 'Electrical' },
        { categoryName: 'Plumbing' },
        { categoryName: 'Gardening' },
        { categoryName: 'Plant' },
        { categoryName: 'Care' },
        { categoryName: 'Shopping' },
        { categoryName: 'Delivery' },
        { categoryName: 'Packing and Lifting' },
        { categoryName: 'Errands' },
        { categoryName: 'Ironing' },
        { categoryName: 'Alteration' },
        { categoryName: 'Pet Care' },
        { categoryName: 'Translation' },
        { categoryName: 'Photography' },
        { categoryName: 'Tutoring' },
        { categoryName: 'Online' },
        { categoryName: 'Design' },
        { categoryName: 'Cooking' },
        { categoryName: 'Events' },
        { categoryName: 'Others' },
    ]);
};
exports.prepopulateData = prepopulateData;
