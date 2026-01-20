import { b2 } from '@/config/bucket';
import {
  BUCKET_FOLDER_NAME,
  BUCKET_NAME,
  REGION_NAME,
} from '@/constants/bucket';
import { RequestFile } from '@/types/file';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import fs from 'fs';

export const uploadToBucket = async (file: RequestFile) => {
  try {
    // Configure the parameters for the S3 upload
    const uploadParams = {
      Bucket: process.env.B2_BUCKET_NAME,
      Key: BUCKET_FOLDER_NAME + file.originalname,
      Body: file.buffer,
    };

    console.log(uploadParams);

    // Upload the file to S3
    const data = await b2.send(new PutObjectCommand(uploadParams));
    if (data) {
      if (fs.existsSync(file.path)) {
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error('Error deleting file:', err);
          } else {
            console.log('File deleted successfully.');
          }
        });
      }
    }
    return getURLOfFileFromBucket(uploadParams.Key);
  } catch (error) {
    console.log('Error occcured while uploadToBucket : ' + error);
    return null;
  }
};

export const deleteFromBucket = async (filename: string) => {
  try {
    // Configure the parameters for the S3 upload
    const uploadParams = {
      Bucket: process.env.B2_BUCKET_NAME,
      Key: filename,
    };
    // Upload the file to S3
    await b2.send(new DeleteObjectCommand(uploadParams));
  } catch (error) {
    console.log('Error occcured while uploadToBucket : ' + error);
  }
};

export const isFileAvailableInBucket = async (fileName: string) => {
  try {
    // Check if the object exists
    const response = await b2.send(
      new HeadObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: fileName,
      }),
    );
    if (!response) {
      return false;
    }
    return true;
  } catch (err) {
    console.log('Error occurred while check is file available in Bucket');
    return false;
  }
};

export const getURLOfFileFromBucket = (fileName: string) => {
  // return `https://s3.${REGION_NAME}.backblazeb2.com/${encodeURI(fileName)}`;
  return `https://storage.railway.app/${BUCKET_NAME}/${encodeURI(fileName)}`;
};
