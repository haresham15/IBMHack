/**
 * lib/cos.js
 * IBM Cloud Object Storage wrapper.
 * In dev: logs and returns a local:// URL.
 * In production: performs a real COS upload.
 */

/**
 * uploadToCOS(buffer, filename)
 *
 * @param {Buffer} buffer - file content
 * @param {string} filename - target object name in the bucket
 * @returns {Promise<{ url: string, bucket: string, key: string }>}
 */
export async function uploadToCOS(buffer, filename) {
  const isDev =
    process.env.NODE_ENV !== 'production' || !process.env.IBM_COS_API_KEY

  if (isDev) {
    console.log(`[COS stub] Skipping upload in dev — file: ${filename} (${buffer?.length ?? 0} bytes)`)
    return {
      url: `local://${filename}`,
      bucket: process.env.IBM_COS_BUCKET ?? 'vantage-syllabi',
      key: filename
    }
  }

  // Production COS upload
  const { default: IBMCOS } = await import('ibm-cos-sdk')

  const cos = new IBMCOS.S3({
    endpoint: process.env.IBM_COS_ENDPOINT,
    apiKeyId: process.env.IBM_COS_API_KEY,
    serviceInstanceId: process.env.IBM_COS_INSTANCE_ID,
    ibmAuthEndpoint: 'https://iam.cloud.ibm.com/identity/token'
  })

  const bucket = process.env.IBM_COS_BUCKET ?? 'vantage-syllabi'

  await cos.putObject({
    Bucket: bucket,
    Key: filename,
    Body: buffer,
    ContentType: 'application/pdf'
  }).promise()

  const endpoint = process.env.IBM_COS_ENDPOINT ?? ''
  return {
    url: `${endpoint}/${bucket}/${filename}`,
    bucket,
    key: filename
  }
}
