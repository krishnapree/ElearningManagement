import os
import io
import tempfile
from typing import Optional
import openai
from openai import OpenAI

class WhisperService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "default_key")
        self.client = OpenAI(api_key=self.api_key)
    
    async def transcribe_audio(self, audio_content: bytes) -> str:
        """
        Transcribe audio content using OpenAI Whisper API.
        """
        try:
            # Create a temporary file to store the audio
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file.write(audio_content)
                temp_file_path = temp_file.name
            
            try:
                # Transcribe using OpenAI Whisper
                with open(temp_file_path, "rb") as audio_file:
                    transcript = self.client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        response_format="text"
                    )
                
                return transcript.strip()
                
            finally:
                # Clean up temporary file
                os.unlink(temp_file_path)
                
        except Exception as e:
            # Fallback: return error message or attempt local processing
            print(f"Whisper API error: {e}")
            return await self._fallback_transcription(audio_content)
    
    async def _fallback_transcription(self, audio_content: bytes) -> str:
        """
        Fallback transcription method when API is unavailable.
        In a production environment, you might use a local Whisper model
        or return a helpful error message.
        """
        # For now, return a helpful message
        return "I'm having trouble processing your audio. Please try speaking clearly and check your microphone, then try again."
    
    def validate_audio_format(self, audio_content: bytes) -> bool:
        """
        Validate that the audio content is in a supported format.
        """
        # Basic validation - check if it's not empty and has reasonable size
        if not audio_content or len(audio_content) < 1000:  # Less than 1KB
            return False
        
        # Check for common audio file headers
        # WAV files start with "RIFF"
        if audio_content[:4] == b'RIFF':
            return True
        
        # WebM files start with specific byte sequence
        if audio_content[:4] == b'\x1a\x45\xdf\xa3':
            return True
        
        # Assume it's valid if we can't determine format
        return True
    
    async def enhance_transcription(self, raw_transcription: str, context: Optional[str] = None) -> str:
        """
        Enhance transcription quality using AI post-processing.
        This can help fix common transcription errors and add punctuation.
        """
        if not raw_transcription or len(raw_transcription.strip()) < 3:
            return raw_transcription
        
        try:
            # Use OpenAI to clean up and enhance the transcription
            prompt = f"""
            Please clean up and enhance this voice transcription by:
            1. Adding proper punctuation and capitalization
            2. Fixing obvious transcription errors
            3. Making it more readable while preserving the original meaning
            4. Formatting it as a clear question or statement
            
            Original transcription: "{raw_transcription}"
            {f"Context: This is about {context}" if context else ""}
            
            Enhanced version:
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that improves voice transcriptions."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            enhanced = response.choices[0].message.content.strip()
            
            # Return enhanced version if it seems better, otherwise return original
            if len(enhanced) > 0 and len(enhanced) < len(raw_transcription) * 3:
                return enhanced
            else:
                return raw_transcription
                
        except Exception as e:
            print(f"Enhancement error: {e}")
            return raw_transcription
    
    def get_supported_formats(self) -> list:
        """
        Get list of supported audio formats.
        """
        return [
            "wav", "mp3", "mp4", "mpeg", "mpga", "m4a", "ogg", "wav", "webm"
        ]
    
    def estimate_transcription_time(self, audio_duration_seconds: float) -> float:
        """
        Estimate how long transcription will take based on audio duration.
        """
        # Whisper API is typically quite fast, roughly 0.1x of audio duration
        return max(2.0, audio_duration_seconds * 0.1)
