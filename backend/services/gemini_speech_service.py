import os
import io
import tempfile
from typing import Optional
import google.generativeai as genai

class GeminiSpeechService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")

        # Configure the Gemini API
        genai.configure(api_key=api_key)

        # Use Gemini model that supports audio
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    async def transcribe_audio(self, audio_content: bytes) -> str:
        """
        Transcribe audio content using Google Gemini API.
        """
        try:
            # Create a temporary file to store the audio
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file.write(audio_content)
                temp_file_path = temp_file.name
            
            try:
                # Upload the audio file to Gemini
                audio_file = genai.upload_file(temp_file_path)
                
                # Create prompt for transcription
                prompt = """
                Please transcribe the audio content accurately. 
                Return only the transcribed text without any additional commentary.
                If the audio is unclear or inaudible, return: "I couldn't understand the audio clearly. Please try speaking more clearly."
                """
                
                # Generate transcription
                response = self.model.generate_content([prompt, audio_file])
                transcription = response.text.strip()
                
                # Clean up the uploaded file from Gemini
                genai.delete_file(audio_file.name)
                
                return transcription
                
            finally:
                # Clean up temporary file
                os.unlink(temp_file_path)
                
        except Exception as e:
            print(f"Gemini Speech API error: {e}")
            return await self._fallback_transcription(audio_content)
    
    async def _fallback_transcription(self, audio_content: bytes) -> str:
        """
        Fallback transcription method when API is unavailable.
        """
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
        
        # MP3 files often start with ID3 tag or frame sync
        if audio_content[:3] == b'ID3' or audio_content[:2] == b'\xff\xfb':
            return True
        
        # Assume it's valid if we can't determine format
        return True
    
    async def enhance_transcription_with_context(self, raw_transcription: str, context: Optional[str] = None) -> str:
        """
        Enhance transcription quality using Gemini AI post-processing.
        """
        if not raw_transcription or len(raw_transcription.strip()) < 3:
            return raw_transcription
        
        try:
            prompt = f"""
            Please improve this voice transcription by:
            1. Adding proper punctuation and capitalization
            2. Fixing obvious transcription errors
            3. Making it more readable while preserving the original meaning
            4. Formatting it as a clear question or statement suitable for an AI tutor
            
            Original transcription: "{raw_transcription}"
            {f"Context: This is about {context}" if context else ""}
            
            Please return only the improved transcription without any additional commentary.
            """
            
            response = self.model.generate_content(prompt)
            enhanced = response.text.strip()
            
            # Return enhanced version if it seems reasonable, otherwise return original
            if len(enhanced) > 0 and len(enhanced) < len(raw_transcription) * 3:
                return enhanced
            else:
                return raw_transcription
                
        except Exception as e:
            print(f"Enhancement error: {e}")
            return raw_transcription
    
    def get_supported_formats(self) -> list:
        """
        Get list of supported audio formats for Gemini API.
        """
        return [
            "wav", "mp3", "aiff", "aac", "ogg", "flac"
        ]
    
    def estimate_transcription_time(self, audio_duration_seconds: float) -> float:
        """
        Estimate how long transcription will take based on audio duration.
        """
        # Gemini API processing time estimate
        return max(3.0, audio_duration_seconds * 0.2)
