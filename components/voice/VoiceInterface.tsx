'use client'
import { useEffect, useRef, useState } from 'react'
import { useVoice } from '@/hooks/useVoice'
import { MicButton } from '@/components/voice/MicButton'

export function VoiceInterface() {
  const {
    isListening,
    isProcessing,
    isSpeaking,
    transcript,
    history,
    selectedVoiceId,
    voices,
    error,
    startListening,
    stopListening,
    sendMessage,
    setSelectedVoiceId,
    clearHistory,
  } = useVoice()

  const [textInput, setTextInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, transcript])

  function handleMicClick() {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  function handleTextSend() {
    const msg = textInput.trim()
    if (!msg || isProcessing) return
    setTextInput('')
    sendMessage(msg)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextSend()
    }
  }

  let micLabel = 'Tap to speak'
  if (isListening) micLabel = 'Listening…'
  else if (isProcessing) micLabel = 'Processing…'
  else if (isSpeaking) micLabel = 'Speaking…'

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 7rem)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <label htmlFor="voice-select" className="text-sm text-zinc-400 whitespace-nowrap">
            Voice
          </label>
          <select
            id="voice-select"
            value={selectedVoiceId}
            onChange={(e) => setSelectedVoiceId(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {voices.length === 0 && (
              <option value="">No voices available</option>
            )}
            {voices.map((v) => (
              <option key={v.voice_id} value={v.voice_id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={clearHistory}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600"
        >
          Clear
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Conversation history */}
      <div className="flex-1 overflow-y-auto rounded-xl bg-zinc-900 border border-zinc-800 p-4 mb-4 flex flex-col gap-3">
        {history.length === 0 && !transcript && (
          <p className="text-zinc-600 text-sm text-center mt-8">
            Say something or type below to start the conversation.
          </p>
        )}

        {history.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-violet-900/50 text-violet-100 rounded-br-sm'
                  : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Live transcript */}
        {transcript && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm bg-violet-900/25 text-violet-300 border border-violet-800/50 italic">
              {transcript}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <MicButton
          isListening={isListening}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
          onClick={handleMicClick}
        />
        <p className="text-sm text-zinc-500">{micLabel}</p>
      </div>

      {/* Text input fallback */}
      <div className="flex gap-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          disabled={isProcessing || isListening}
          className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-600 disabled:opacity-50"
        />
        <button
          onClick={handleTextSend}
          disabled={isProcessing || isListening || !textInput.trim()}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
