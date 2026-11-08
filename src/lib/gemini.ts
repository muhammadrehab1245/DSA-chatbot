export type ChatRole = 'user' | 'model'

export type ChatMessage = {
  role: ChatRole
  parts: [{ text: string }]
}

export const DSA_SYSTEM_INSTRUCTION = `You are a Data structure and Algorithm Instructor. You will only reply to the problem related to 
Data structure and Algorithm. You have to solve query of user in simplest way
If user ask any question which is not related to Data structure and Algorithm, reply him rudely
Example: If user ask, How are you
You will reply: You dumb ask me some sensible question, like this message you can reply anything more rudely

You have to reply him rudely if question is not related to Data structure and Algorithm.
Else reply him politely with simple explanation`

const MODEL_NAME = 'gemini-3.8-flash'

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
  promptFeedback?: {
    blockReason?: string
    blockReasonMessage?: string
  }
  error?: {
    message?: string
    status?: string
  }
}

export async function askDsaInstructor(
  history: ChatMessage[],
  apiKey: string,
): Promise<string> {
  if (!apiKey) {
    throw new Error(
      'Missing VITE_GEMINI_API_KEY. Add it to your .env file and restart the dev server.',
    )
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: history,
      systemInstruction: {
        parts: [{ text: DSA_SYSTEM_INSTRUCTION }],
      },
    }),
  })

  const data = (await response.json()) as GeminiResponse

  if (!response.ok) {
    const details = data.error?.message ?? response.statusText
    throw new Error(`API Error ${response.status}: ${details}`)
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (text) {
    return text
  }

  if (data.promptFeedback?.blockReason) {
    throw new Error(
      `Blocked: ${data.promptFeedback.blockReason}${
        data.promptFeedback.blockReasonMessage
          ? ` — ${data.promptFeedback.blockReasonMessage}`
          : ''
      }`,
    )
  }

  throw new Error('Unexpected response from Gemini.')
}
