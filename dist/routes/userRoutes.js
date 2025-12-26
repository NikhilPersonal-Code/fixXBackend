"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = express_1.default.Router();
// Using PATCH for updating a resource is a good practice.
// The upload.single('profileImage') middleware will handle the file upload.
// 'profileImage' should be the name of the field in your form-data.
router.patch('/updateprofile/:userId', upload_1.default.single('profileImage'), userController_1.updateProfile);
exports.default = router;
