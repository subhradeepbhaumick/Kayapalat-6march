import { writeFile, unlink, access, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

// Generate local file URL for secure file access
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

    // For local storage, return direct path
    return `/api/images/resolve?path=${encodeURIComponent(key)}`;
  } catch (error) {
    console.error('Error generating file access URL:', error);
    throw new Error('Failed to generate file access URL');
  }
};

// Upload design file to local storage
export const uploadDesignLocal = async (key, fileBuffer, mimeType) => {
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

    // Save to local public directory
    const localPath = join(process.cwd(), 'public', key);
    const dir = dirname(localPath);
    try {
      await access(dir);
    } catch {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(localPath, fileBuffer);

    console.log(`[LOCAL_UPLOAD_SUCCESS] Saved: ${localPath}`);
    return {
      success: true,
      key: key,
      bucket: 'local',
      etag: 'local-file',
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[LOCAL_UPLOAD_ERROR]', error);
    throw error;
  }
};

// Safe delete operation for design files - only allows single object deletion
export const deleteDesignLocalFile = async (key) => {
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

    // Delete local file
    const localPath = join(process.cwd(), 'public', key);
    await unlink(localPath);

    console.log(`[LOCAL_DELETE_SUCCESS] Deleted: ${localPath}`);
    return {
      success: true,
      key: key,
      deletedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('[LOCAL_DELETE_ERROR]', error);
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
