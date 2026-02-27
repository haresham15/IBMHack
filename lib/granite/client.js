/**
 * lib/granite/client.js
 * IBM WatsonX Granite API wrapper with IAM token caching.
 */

// Module-level token cache — persists across calls within the same process
let tokenCache = { token: null, expiresAt: 0 }

async function getIAMToken() {
  const now = Date.now()
  // Refresh 60 seconds before expiry
  if (tokenCache.token && tokenCache.expiresAt - now > 60_000) {
    return tokenCache.token
  }

  const apiKey = process.env.IBM_API_KEY
  if (!apiKey) throw new Error('IBM_API_KEY not set in environment')

  const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
    signal: AbortSignal.timeout(15_000)
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`IAM token request failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  if (!data.access_token) throw new Error('IAM response missing access_token')

  // IBM IAM tokens expire in 3600s by default
  const expiresIn = data.expires_in ?? 3600
  tokenCache = {
    token: data.access_token,
    expiresAt: now + expiresIn * 1000
  }

  return tokenCache.token
}

/**
 * callGranite(prompt, options)
 * Sends a formatted prompt to WatsonX Granite and returns generated text.
 *
 * @param {string} prompt - Full formatted prompt (system + user + assistant delimiters)
 * @param {{ maxTokens?: number, temperature?: number }} options
 * @returns {Promise<string>} raw generated text
 */
export async function callGranite(prompt, options = {}) {
  const token = await getIAMToken()
  const url = process.env.WATSONX_URL ?? 'https://us-south.ml.cloud.ibm.com'
  const projectId = process.env.WATSONX_PROJECT_ID
  if (!projectId) throw new Error('WATSONX_PROJECT_ID not set in environment')

  const res = await fetch(`${url}/ml/v1/text/generation?version=2023-05-29`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model_id: 'ibm/granite-13b-instruct-v2',
      input: prompt,
      parameters: {
        max_new_tokens: options.maxTokens ?? 2048,
        temperature: options.temperature ?? 0.1,
        repetition_penalty: 1.05
      },
      project_id: projectId
    }),
    signal: AbortSignal.timeout(60_000)
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Granite API error (${res.status}): ${text}`)
  }

  const data = await res.json()
  const text = data?.results?.[0]?.generated_text
  if (text === undefined || text === null) {
    throw new Error(`Granite returned no text. Response: ${JSON.stringify(data)}`)
  }

  return text
}

/**
 * safeParseJSON(text)
 * Tries 3 approaches to parse JSON from Granite output:
 *   1. Direct JSON.parse
 *   2. Strip markdown code fences then parse
 *   3. Ask Granite to repair the broken JSON
 *
 * @param {string} text
 * @returns {Promise<any>} parsed object
 */
export async function safeParseJSON(text) {
  // Approach 1: direct parse
  try {
    return JSON.parse(text)
  } catch {}

  // Approach 2: strip markdown fences and leading/trailing prose
  const fenceStripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
  try {
    return JSON.parse(fenceStripped)
  } catch {}

  // Try extracting the first {...} block from the response
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1))
    } catch {}
  }

  // Approach 3: call Granite to repair the broken JSON
  const repairPrompt = `<|system|>
You are a JSON repair tool. Output ONLY the corrected, valid JSON with no explanation.
<|user|>
The following text is supposed to be JSON but has syntax errors. Fix it and return valid JSON only:

${text.slice(0, 3000)}
<|assistant|>`

  const repaired = await callGranite(repairPrompt, { maxTokens: 2048, temperature: 0 })

  // Try parsing the repaired output
  try {
    return JSON.parse(repaired.trim())
  } catch {}

  const repFenced = repaired
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
  try {
    return JSON.parse(repFenced)
  } catch {}

  throw new Error(`safeParseJSON failed after 3 attempts. Raw text:\n${text.slice(0, 500)}`)
}
