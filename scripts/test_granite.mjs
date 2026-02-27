// IBM Granite connection test — runs outside Next.js
import { readFileSync } from 'fs'

// Load from .env.local manually
const env = readFileSync('.env.local', 'utf8').split('\n')
  .reduce((acc, line) => {
    const [k, ...v] = line.split('=')
    if (k) acc[k.trim()] = v.join('=').trim()
    return acc
  }, {})

const IBM_API_KEY = env.IBM_API_KEY
const WATSONX_URL = env.WATSONX_URL
const WATSONX_PROJECT_ID = env.WATSONX_PROJECT_ID

if (!IBM_API_KEY || IBM_API_KEY === 'YOUR_IBM_API_KEY') {
  console.error('FAILED: IBM_API_KEY not set in .env.local')
  process.exit(1)
}

// Step 1: Get IAM token
const tokenRes = await fetch('https://iam.cloud.ibm.com/identity/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${IBM_API_KEY}`
})
const { access_token } = await tokenRes.json()
if (!access_token) {
  console.error('FAILED: Could not get IAM token')
  process.exit(1)
}
console.log('IAM token obtained ✓')

// Step 2: Call Granite
const genRes = await fetch(`${WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model_id: 'ibm/granite-3-8b-instruct',
    input: '<|system|>\nYou are a helpful assistant.\n<|user|>\nSay hello in one sentence.\n<|assistant|>',
    parameters: { max_new_tokens: 50, temperature: 0.1 },
    project_id: WATSONX_PROJECT_ID
  })
})
const result = await genRes.json()
const text = result?.results?.[0]?.generated_text
if (!text) {
  console.error('FAILED: No text in response. Full response:', JSON.stringify(result, null, 2))
  process.exit(1)
}
console.log('SUCCESS — Granite response:', text.trim())
