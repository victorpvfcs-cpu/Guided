// Server-side example: use AWS SDK, @azure/storage-blob, or Backblaze S3 SDK here.
// Expose only authenticated endpoints that return short-lived presigned URLs.
export async function getStorageConfig(provider){
  if(!['s3','backblaze','azure'].includes(provider)) throw new Error('Unsupported provider');
  return {provider, downloadUrl:'/api/workflows/latest', uploadUrl:'/api/workflows'};
}
