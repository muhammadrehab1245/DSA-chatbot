import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { askDsaInstructor, type ChatMessage } from './lib/gemini'
import './App.css'

const WELCOME: ChatMessage = {
  role: 'model',
  parts: [
    {
      text: 'Ask me any Data Structures & Algorithms question — arrays, trees, graphs, sorting, complexity, and more.',
    },
  ],
}

function App() {
  const [history, setHistory] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  async function handleSend() {
    const question = input.trim()
    if (!question || loading) return

    setError('')
    setInput('')

    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: question }],
    }

    // Welcome message is UI-only; do not send it to the API
    const apiHistory = history.filter((msg) => msg !== WELCOME)
    const nextHistory = [...apiHistory, userMessage]

    setHistory((prev) => {
      const withoutWelcome = prev.filter((msg) => msg !== WELCOME)
      return [...withoutWelcome, userMessage]
    })
    setLoading(true)

    try {
      const answer = await askDsaInstructor(nextHistory, apiKey ?? '')
      const modelMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: answer }],
      }
      setHistory((prev) => [...prev, modelMessage])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="chat-app">
      <header className="chat-header">
        <div>
          <h1>DSA Instructor</h1>
          <p>Ask only DSA questions. Off-topic gets a rude reply.</p>
        </div>
      </header>

      <main className="chat-messages" aria-live="polite">
        {history.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`bubble ${msg.role === 'user' ? 'user' : 'model'}`}
          >
            <span className="bubble-label">
              {msg.role === 'user' ? 'You' : 'Instructor'}
            </span>
            <p>{msg.parts[0].text}</p>
          </div>
        ))}

        {loading && (
          <div className="bubble model loading">
            <span className="bubble-label">Instructor</span>
            <p>Thinking…</p>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        <div ref={bottomRef} />
      </main>

      <footer className="chat-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="e.g. Explain binary search with an example"
          rows={2}
          disabled={loading}
        />
        <button type="button" onClick={() => void handleSend()} disabled={loading || !input.trim()}>
          {loading ? '…' : 'Ask'}
        </button>
      </footer>
    </div>
  )
}

export default App
