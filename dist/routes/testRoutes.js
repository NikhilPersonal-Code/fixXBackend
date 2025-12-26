"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const testController_1 = require("../controllers/testController");
const router = express_1.default.Router();
router.get('/getusers', testController_1.getUsers);
router.post('/get', testController_1.getAnything);
router.get('/test', testController_1.test);
router.get('/prepopulate-data', testController_1.prepopulateData);
exports.default = router;
