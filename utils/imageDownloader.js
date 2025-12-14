const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

/**
 * Downloads an image from a URL and saves it to a local directory.
 * @param {string} url The URL of the image to download.
 * @param {string} destinationFolder The folder to save the image in (e.g., 'uploads/').
 * @returns {Promise<string>} The local path to the saved image (e.g., '/uploads/filename.jpg').
 */
const downloadImage = async (url, destinationFolder = "uploads/") => {
  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    const extension = response.headers["content-type"].split("/")[1] || "jpg";
    const filename = `${uuidv4()}.${extension}`;
    const localPath = path.join(destinationFolder, filename);

    const writer = fs.createWriteStream(localPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(`/${destinationFolder}${filename}`));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("Failed to download image:", error);
    // Return the original URL as a fallback
    return url;
  }
};

module.exports = { downloadImage };
