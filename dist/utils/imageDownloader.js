"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadImage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
/**
 * Downloads an image from a URL and saves it to a local directory.
 * @param {string} url The URL of the image to download.
 * @param {string} destinationFolder The folder to save the image in (e.g., 'uploads/').
 * @returns {Promise<string>} The local path to the saved image (e.g., '/uploads/filename.jpg').
 */
const downloadImage = async (url, destinationFolder = 'public/uploads/') => {
    try {
        const response = await (0, axios_1.default)({
            url,
            method: 'GET',
            responseType: 'stream',
        });
        const contentType = response.headers['content-type'];
        const extension = contentType ? contentType.split('/')[1] : 'jpg';
        const filename = `${(0, uuid_1.v4)()}.${extension}`;
        const localPath = path_1.default.join(destinationFolder, filename);
        const writer = fs_1.default.createWriteStream(localPath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(`/uploads/${filename}`));
            writer.on('error', reject);
        });
    }
    catch (error) {
        console.error('Failed to download image:', error);
        // Return the original URL as a fallback
        return url;
    }
};
exports.downloadImage = downloadImage;
