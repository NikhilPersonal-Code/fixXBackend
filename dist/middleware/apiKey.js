"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.header('X-API-Key');
    if (!apiKey) {
        return res.status(401).json({ message: 'Not Authorized' });
    }
    if (apiKey !== process.env.API_KEY) {
        return res.status(401).json({ message: 'Invalid API Key' });
    }
    next(); // API key is valid — continue to the next middleware or route
};
exports.default = apiKeyMiddleware;
