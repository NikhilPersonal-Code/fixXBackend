import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import cloudinary from '@config/cloudinaryConfig';
import { UpdateProfileRequest } from '@/types/common';

// Use memory storage to get file buffer for Cloudinary upload
const storage = multer.memoryStorage();

// Create the multer instance
const multerUpload = multer({
  storage: storage,
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Helper function to upload buffer to Cloudinary
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string = 'fixx',
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error('Upload failed with no result'));
        }
      },
    );
    uploadStream.end(buffer);
  });
};

// Helper function to delete image from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Successfully deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error(`Error deleting image from Cloudinary: ${publicId}`, error);
  }
};

// Extract public_id from Cloudinary URL
export const getPublicIdFromUrl = (url: string): string | null => {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{format}
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

// Middleware wrapper for single file upload with Cloudinary
const upload = {
  single: (fieldName: string) => {
    return [
      multerUpload.single(fieldName),
      async (req: UpdateProfileRequest, res: Response, next: NextFunction) => {
        if (!req.file) {
          return next();
        }

        try {
          const result = await uploadToCloudinary(
            req.file.buffer,
            'fixx/profiles',
          );
          // Attach Cloudinary URL and public_id to the request
          req.cloudinaryUrl = result.secure_url;
          req.cloudinaryPublicId = result.public_id;
          next();
        } catch (error) {
          console.error('Cloudinary upload error:', error);
          return res
            .status(500)
            .json({ message: 'Error uploading image to cloud storage.' });
        }
      },
    ];
  },
};

export default upload;
