import React, { useState, useRef } from 'react'

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
  disabled?: boolean
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await processAudio(audioBlob)
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Error accessing microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsProcessing(true)
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')

      const response = await fetch('/api/voice', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to transcribe audio')
      }

      const data = await response.json()
      onTranscription(data.text)
    } catch (error) {
      console.error('Error processing audio:', error)
      alert('Error processing audio. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={toggleRecording}
        disabled={disabled || isProcessing}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600 recording-pulse' 
            : 'bg-primary-500 hover:bg-primary-600'
        } ${
          disabled || isProcessing 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer'
        }`}
      >
        {isProcessing ? (
          <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
        ) : (
          <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} text-white text-xl`}></i>
        )}
      </button>

      <div className="text-center">
        {isRecording && (
          <p className="text-red-600 font-medium animate-pulse">
            Recording... Click to stop
          </p>
        )}
        {isProcessing && (
          <p className="text-primary-600 font-medium">
            Processing audio...
          </p>
        )}
        {!isRecording && !isProcessing && (
          <p className="text-gray-600">
            Click to start voice recording
          </p>
        )}
      </div>

      <div className="text-xs text-gray-500 text-center max-w-xs">
        <p>Hold and speak clearly for best results</p>
        <p>Make sure your microphone is enabled</p>
      </div>
    </div>
  )
}

export default VoiceRecorder
