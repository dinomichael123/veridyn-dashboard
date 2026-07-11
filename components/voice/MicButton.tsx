'use client'

interface MicButtonProps {
  isListening: boolean
  isProcessing: boolean
  isSpeaking: boolean
  onClick: () => void
}

export function MicButton({ isListening, isProcessing, isSpeaking, onClick }: MicButtonProps) {
  let bgClass = 'bg-violet-600 hover:bg-violet-500'
  let label = 'Mic'
  let content: React.ReactNode

  if (isListening) {
    bgClass = 'bg-red-500'
    label = 'Stop'
    content = (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
        <rect x="6" y="6" width="12" height="12" rx="1" />
      </svg>
    )
  } else if (isProcessing) {
    bgClass = 'bg-zinc-600'
    label = 'Processing'
    content = (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="w-10 h-10 animate-spin"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364-2.121 2.121M8.757 15.243l-2.121 2.121m12.728 0-2.121-2.121M8.757 8.757 6.636 6.636"
        />
      </svg>
    )
  } else if (isSpeaking) {
    bgClass = 'bg-green-600'
    label = 'Speaking'
    content = (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 animate-pulse">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
      </svg>
    )
  } else {
    content = (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
      </svg>
    )
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Ping ring — only while listening */}
      {isListening && (
        <span className="absolute inline-flex h-24 w-24 rounded-full bg-red-400 opacity-75 animate-ping" />
      )}
      <button
        onClick={onClick}
        aria-label={label}
        disabled={isProcessing}
        className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-white transition-colors ${bgClass} disabled:cursor-not-allowed`}
      >
        {content}
      </button>
    </div>
  )
}
