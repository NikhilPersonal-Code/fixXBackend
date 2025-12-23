import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Downloads an image from a URL and saves it to a local directory.
 * @param {string} url The URL of the image to download.
 * @param {string} destinationFolder The folder to save the image in (e.g., 'uploads/').
 * @returns {Promise<string>} The local path to the saved image (e.g., '/uploads/filename.jpg').
 */
export const downloadImage = async (
  url: string,
  destinationFolder: string = 'public/uploads/',
): Promise<string> => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    const contentType = response.headers['content-type'] as string;
    const extension = contentType ? contentType.split('/')[1] : 'jpg';
    const filename = `${uuidv4()}.${extension}`;
    const localPath = path.join(destinationFolder, filename);

    const writer = fs.createWriteStream(localPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`/uploads/${filename}`));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Failed to download image:', error);
    // Return the original URL as a fallback
    return url;
  }
};
