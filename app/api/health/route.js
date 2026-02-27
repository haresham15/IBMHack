export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'vantage-nextjs',
    timestamp: new Date().toISOString(),
    ibmConfigured: !!(process.env.IBM_API_KEY && process.env.WATSONX_PROJECT_ID),
    nodeVersion: process.version
  })
}
