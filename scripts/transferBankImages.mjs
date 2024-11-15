import dotenv from 'dotenv';
dotenv.config();  // Load environment variables from .env file

import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';  // Correct import for file-type
import mime from 'mime-types';

// Get the current directory using import.meta.url
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Configure AWS SDK (Including explicit accessKeyId and secretAccessKey for debugging)
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,  // AWS credentials from the .env file
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,  // AWS credentials from the .env file
  region: process.env.AWS_REGION,  // Region from the .env file
});

const s3 = new AWS.S3();
const sourceDirectory = path.join(__dirname, '..', 'bankimages');  // Local source directory (one level up from scripts)
const destinationBucketName = 'bankimg.localsolana.com'; // Your destination S3 bucket
const logFilePath = path.join(__dirname, 'unprocessable_files.log');  // Log file to track unprocessable files

const dryRun = process.argv.includes('--dry-run'); // Check for dry-run flag

// Function to get files from the local 'bankimages' directory
function listFilesInDirectory() {
  try {
    const files = fs.readdirSync(sourceDirectory);
    return files.filter(file => fs.lstatSync(path.join(sourceDirectory, file)).isFile());
  } catch (err) {
    console.error('Error reading files from local directory:', err);
    throw err;
  }
}

// Function to read the file from the local system
async function readFileFromLocal(fileName) {
  const filePath = path.join(sourceDirectory, fileName);
  try {
    const data = fs.readFileSync(filePath);
    return data;  // Returns the file content as a buffer
  } catch (err) {
    console.error(`Error reading ${fileName}:`, err);
    throw err;
  }
}

// Function to detect file type based on file content
async function getFileType(buffer) {
  try {
    const type = await fileTypeFromBuffer(buffer);
    return type;
  } catch (err) {
    console.error('Error detecting file type:', err);
    return null; // Return null if unable to detect file type
  }
}

// Function to upload file to S3 bucket
async function uploadFileToS3(fileBuffer, s3Key, dryRun) {
  if (dryRun) {
    console.log(`Dry run: Skipping upload for ${s3Key}`);
    return;
  }

  const mimeType = mime.lookup(s3Key) || 'application/octet-stream';  // Fallback content type

  const params = {
    Bucket: destinationBucketName,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  try {
    await s3.upload(params).promise();
    console.log(`Uploaded ${s3Key} to ${destinationBucketName}`);
  } catch (err) {
    console.error(`Error uploading ${s3Key}:`, err);
  }
}

// Function to log unprocessable files to the log file
function logUnprocessableFile(fileName) {
  try {
    fs.appendFileSync(logFilePath, `${fileName}\n`);
    console.log(`Logged unprocessable file: ${fileName}`);
  } catch (err) {
    console.error('Error logging unprocessable file:', err);
  }
}

// Main function to process files from the local 'bankimages' directory
async function processImages() {
  const files = listFilesInDirectory();

  for (const file of files) {
    try {
      const fileBuffer = await readFileFromLocal(file);
      const type = await getFileType(fileBuffer);

      if (type) {
        let newExtension = '';
        switch (type.mime) {
          case 'image/jpeg':
            newExtension = '.jpg';
            break;
          case 'image/png':
            newExtension = '.png';
            break;
          case 'image/gif':
            newExtension = '.gif';
            break;
          case 'image/webp':
            newExtension = '.webp';
            break;
          default:
            console.log(`Unsupported file type for ${file}: ${type.mime}`);
            continue;  // Skip unsupported file types
        }

        const newFileName = path.basename(file, path.extname(file)) + newExtension;
        const s3Key = `${newFileName}`;

        // Dry run or actual upload
        await uploadFileToS3(fileBuffer, s3Key, dryRun);
      } else {
        console.log(`Could not determine file type for ${file}. Logging it.`);
        logUnprocessableFile(file);  // Log the unprocessable file
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
}

// Run the script
processImages()
  .then(() => console.log('Processing complete.'))
  .catch((err) => console.error('Error:', err));
