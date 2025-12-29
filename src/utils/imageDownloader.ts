import axios from 'axios';
import cloudinary from '@config/cloudinaryConfig';

/**
 * Downloads an image from a URL and uploads it to Cloudinary.
 * @param {string} url The URL of the image to download.
 * @param {string} folder The Cloudinary folder to save the image in (e.g., 'fixx/profiles').
 * @returns {Promise<string>} The Cloudinary URL of the uploaded image.
 */
export const uploadImageToCloudinary = async (
  url: string,
  folder: string = 'fixx/profiles',
): Promise<string> => {
  try {
    // Upload to Cloudinary
    return new Promise((resolve, _) => {
      cloudinary.uploader.upload(
        url,
        {
          folder: folder,
          unique_filename: true,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.error('Failed to upload image to Cloudinary:', error);
            // Return the original URL as a fallback
            resolve(url);
          } else if (result) {
            resolve(result.secure_url);
          } else {
            resolve(url);
          }
        },
      );
    });
  } catch (error) {
    console.error('Failed to download image:', error);
    // Return the original URL as a fallback
    return url;
  }
};
