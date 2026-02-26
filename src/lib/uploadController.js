import { GetObjectCommand,PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from './s3Client.js';

// Generate presigned URL for secure file access
export const generatePresignedUrl = async (key, expiresIn = 3600) => {
  try {
    // Validate key to prevent access to unauthorized files
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid file key provided');
    }

    // Prevent access to sensitive files or root directories
    if (key.startsWith('private/') || key === 'public/' || key.includes('../')) {
      throw new Error('Access denied to this file');
    }

    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate file access URL');
  }
};

// Upload file to B2 bucket
export const uploadToB2 = async (key, fileBuffer, mimeType) => {
  try {
    // Validate inputs
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid file key provided');
    }
    if (!fileBuffer || !(fileBuffer instanceof Buffer || fileBuffer instanceof Uint8Array)) {
      throw new Error('Invalid file buffer provided');
    }

    // Prevent uploads to sensitive paths
    if (key.startsWith('private/') || key === 'public/' || key.includes('../')) {
      throw new Error('Upload to this path is not allowed');
    }

    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      // Add cache control for better performance
      CacheControl: 'max-age=31536000', // 1 year
    });

    const result = await s3Client.send(command);

    console.log(`[B2_UPLOAD_SUCCESS] Uploaded: ${key}`);
    return {
      success: true,
      key: key,
      bucket: process.env.B2_BUCKET_NAME,
      etag: result.ETag,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[B2_UPLOAD_ERROR]', error);
    throw error;
  }
};

// Safe delete operation - only allows single object deletion
export const deleteFile = async (key) => {
  try {
    // Extensive validation to prevent dangerous operations
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid file key provided');
    }

    // Prevent deletion of root directories or sensitive files
    if (key === 'public/' ||
        key.startsWith('public/') && key.endsWith('/') ||
        key.includes('../') ||
        key.startsWith('private/')) {
      throw new Error('Deletion of directories or sensitive files is not allowed');
    }

    // Ensure it's a single file path (not a prefix that could delete multiple files)
    if (key.endsWith('/') || key.includes('*')) {
      throw new Error('Only single file deletion is allowed');
    }

    // Log the delete operation for audit trail
    console.log(`[FILE_DELETE] Deleting file: ${key} at ${new Date().toISOString()}`);

    const command = new DeleteObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
    });

    const result = await s3Client.send(command);

    console.log(`[FILE_DELETE_SUCCESS] Successfully deleted: ${key}`);
    return {
      success: true,
      key: key,
      deletedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[FILE_DELETE_ERROR]', error);
    throw error;
  }
};

// Handle upload response
export const handleUploadSuccess = (file) => {
  return {
    success: true,
    file: {
      key: file.key,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      location: file.location,
      bucket: file.bucket,
      uploadedAt: new Date().toISOString()
    }
  };
};

// Handle upload error
export const handleUploadError = (error) => {
  console.error('[UPLOAD_ERROR]', error);

  // Provide user-friendly error messages
  let message = 'Upload failed';
  if (error.code === 'LIMIT_FILE_SIZE') {
    message = 'File too large. Maximum size is 5MB.';
  } else if (error.message.includes('Invalid file type')) {
    message = error.message;
  } else if (error.message.includes('Invalid upload folder')) {
    message = error.message;
  }

  return {
    success: false,
    error: message,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  };
};

// Validate upload request
export const validateUploadRequest = (req) => {
  const errors = [];

  // Check if file was uploaded
  if (!req.file) {
    errors.push('No file uploaded');
  }

  // Validate folder if provided
  if (req.body.folder) {
    const allowedFolders = ['public/uploads', 'public/blogs', 'public/avatars'];
    if (!allowedFolders.includes(req.body.folder)) {
      errors.push(`Invalid folder. Allowed: ${allowedFolders.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
