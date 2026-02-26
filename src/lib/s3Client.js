import { S3Client } from '@aws-sdk/client-s3';

// Backblaze B2 S3-compatible client configuration
// Critical: forcePathStyle is required for B2 compatibility
// B2 doesn't support virtual-hosted style URLs like AWS S3
const s3Client = new S3Client({
  region: process.env.B2_REGION, // Default B2 region
  endpoint: process.env.B2_ENDPOINT, // e.g., 'https://s3.us-west-002.backblazeb2.com'
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY_ID,
    secretAccessKey: process.env.B2_SECRET_ACCESS_KEY,
  },
  // Force path-style access - REQUIRED for Backblaze B2
  forcePathStyle: true,
  // Disable AWS-specific features that don't work with B2
  // B2 doesn't support these AWS S3 features
  disableMultiregionAccessPoints: true,
  // Custom user agent to identify requests
  customUserAgent: 'KayaPalat-SaaS-BackblazeB2',
});

export default s3Client;
