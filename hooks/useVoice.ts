'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface VoiceState {
  isListening: boolean
  isProcessing: boolean
  isSpeaking: boolean
  transcript: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  selectedVoiceId: string
  voices: Array<{ voice_id: string; name: string }>
  error: string | null
}

export function useVoice() {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [selectedVoiceId, setSelectedVoiceId] = useState('')
  const [voices, setVoices] = useState<Array<{ voice_id: string; name: string }>>([])
  const [error, setError] = useState<string | null>(null)

  // Refs for stable access inside async callbacks and event handlers
  const recognitionRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const transcriptRef = useRef('')
  const historyRef = useRef(history)
  const selectedVoiceIdRef = useRef(selectedVoiceId)

  useEffect(() => {
    historyRef.current = history
  }, [history])

  useEffect(() => {
    selectedVoiceIdRef.current = selectedVoiceId
  }, [selectedVoiceId])

  // Fetch voices on mount
  useEffect(() => {
    fetch('/api/tts/voices')
      .then((r) => r.json())
      .then((data) => {
        const v: Array<{ voice_id: string; name: string }> = data.voices ?? []
        setVoices(v)
        if (v.length > 0) {
          const rachel = v.find((vv) => vv.name.toLowerCase().includes('rachel'))
          const defaultVoice = rachel ?? v[0]
          setSelectedVoiceId(defaultVoice.voice_id)
        }
      })
      .catch(() => {
        // Voices unavailable — text-only mode
      })
  }, [])

  const playAudio = useCallback(async (audioBlob: Blob) => {
    const url = URL.createObjectURL(audioBlob)
    const audio = new Audio(url)
    setIsSpeaking(true)
    audio.onended = () => {
      setIsSpeaking(false)
      URL.revokeObjectURL(url)
    }
    await audio.play()
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return

      const currentHistory = historyRef.current
      setIsProcessing(true)
      setError(null)
      setTranscript('')
      transcriptRef.current = ''

      try {
        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history: currentHistory }),
        })

        if (!chatRes.ok) {
          const errData = await chatRes.json().catch(() => ({ error: 'Chat API error' }))
          throw new Error(errData.error ?? 'Chat API error')
        }

        const { reply } = await chatRes.json()

        const newHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [
          ...currentHistory,
          { role: 'user', content: text },
          { role: 'assistant', content: reply },
        ]
        setHistory(newHistory)
        setIsProcessing(false)

        // TTS — only if voice is configured
        const voiceId = selectedVoiceIdRef.current
        if (voiceId && reply) {
          try {
            const ttsRes = await fetch('/api/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: reply, voice_id: voiceId }),
            })
            if (ttsRes.ok) {
              const blob = await ttsRes.blob()
              await playAudio(blob)
            }
          } catch {
            // TTS failures are non-fatal — the text reply is already shown
          }
        }
      } catch (err) {
        setError(String(err))
        setIsProcessing(false)
      }
    },
    [playAudio]
  )

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) {
      setError('Speech recognition is not supported in this browser. Use the text input below.')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRec() as any
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        interim += event.results[i][0].transcript
      }
      setTranscript(interim)
      transcriptRef.current = interim
    }

    recognition.onend = () => {
      setIsListening(false)
      const finalTranscript = transcriptRef.current
      if (finalTranscript.trim()) {
        sendMessage(finalTranscript)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`)
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setError(null)
  }, [sendMessage])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    setTranscript('')
    transcriptRef.current = ''
  }, [])

  return {
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
  }
}
