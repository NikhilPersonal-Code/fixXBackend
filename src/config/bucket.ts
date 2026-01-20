// Import necessary modules from AWS SDK
import {
  S3Client,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import 'dotenv/config';

// Initialize an S3 client with provided credentials
export const b2 = new S3Client({
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID || '', // Access key ID from environment variables
    secretAccessKey: process.env.B2_APPLICATION_ACCESS_KEY || '', // Secret access key from environment variables
  },
  region: process.env.B2_REGION_NAME, // Specify the AWS region from environment variables
  endpoint: process.env.B2_ENDPOINT_URL,
});
