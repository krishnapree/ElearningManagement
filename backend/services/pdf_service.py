import os
import io
import PyPDF2
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from models import PDFDocument, ChatSession, ChatMessage
from services.gemini_service import GeminiService

class PDFService:
    def __init__(self):
        self.gemini_service = GeminiService()
        self.max_file_size = 10 * 1024 * 1024  # 10MB limit
        self.allowed_extensions = {'.pdf'}

    def validate_pdf_file(self, filename: str, file_size: int) -> Dict[str, Any]:
        """Validate uploaded PDF file"""
        errors = []
        
        # Check file extension
        if not filename.lower().endswith('.pdf'):
            errors.append("Only PDF files are allowed")
        
        # Check file size
        if file_size > self.max_file_size:
            errors.append(f"File size must be less than {self.max_file_size // (1024*1024)}MB")
        
        if file_size == 0:
            errors.append("File is empty")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }

    def extract_text_from_pdf(self, pdf_content: bytes) -> str:
        """Extract text content from PDF bytes"""
        try:
            pdf_file = io.BytesIO(pdf_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_content = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text_content += page.extract_text() + "\n"
            
            # Clean up the text
            text_content = text_content.strip()
            
            if not text_content:
                raise ValueError("No text content found in PDF")
            
            return text_content
            
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")

    async def process_pdf_upload(self, db: Session, user_id: int, filename: str, 
                                file_content: bytes) -> Dict[str, Any]:
        """Process uploaded PDF and generate summary"""
        try:
            # Validate file
            validation = self.validate_pdf_file(filename, len(file_content))
            if not validation["valid"]:
                return {
                    "success": False,
                    "errors": validation["errors"]
                }
            
            # Extract text from PDF
            extracted_text = self.extract_text_from_pdf(file_content)
            
            # Truncate text if too long (for AI processing)
            max_text_length = 50000  # Limit for AI processing
            if len(extracted_text) > max_text_length:
                extracted_text = extracted_text[:max_text_length] + "...[truncated]"
            
            # Generate AI summary
            summary = await self._generate_summary(extracted_text)
            
            # Save to database
            pdf_document = PDFDocument(
                user_id=user_id,
                filename=filename,
                file_size=len(file_content),
                content_text=extracted_text,
                summary=summary,
                upload_date=datetime.now(timezone.utc)
            )
            
            db.add(pdf_document)
            db.commit()
            db.refresh(pdf_document)
            
            # Create initial chat session
            chat_session = ChatSession(
                user_id=user_id,
                pdf_document_id=pdf_document.id,
                session_name=f"Chat about {filename}",
                created_date=datetime.now(timezone.utc),
                last_activity=datetime.now(timezone.utc)
            )
            
            db.add(chat_session)
            db.commit()
            db.refresh(chat_session)
            
            return {
                "success": True,
                "pdf_id": pdf_document.id,
                "chat_session_id": chat_session.id,
                "summary": summary,
                "filename": filename,
                "text_length": len(extracted_text)
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "errors": [f"Failed to process PDF: {str(e)}"]
            }

    async def _generate_summary(self, text_content: str) -> str:
        """Generate AI summary of PDF content"""
        try:
            prompt = f"""
            Please provide a comprehensive summary of the following document. 
            Include:
            1. Main topics and themes
            2. Key concepts and definitions
            3. Important facts and figures
            4. Learning objectives (if applicable)
            
            Make the summary educational and suitable for creating quiz questions later.
            
            Document content:
            {text_content}
            """
            
            response = await self.gemini_service.get_response(prompt)
            return response.get("text", "Summary generation failed")
            
        except Exception as e:
            return f"Failed to generate summary: {str(e)}"

    async def chat_about_pdf(self, db: Session, user_id: int, chat_session_id: int, 
                           user_message: str) -> Dict[str, Any]:
        """Handle chat conversation about PDF content"""
        try:
            # Get chat session and PDF content
            chat_session = db.query(ChatSession).filter(
                ChatSession.id == chat_session_id,
                ChatSession.user_id == user_id
            ).first()
            
            if not chat_session:
                raise ValueError("Chat session not found")
            
            pdf_document = chat_session.pdf_document
            if not pdf_document:
                raise ValueError("PDF document not found")
            
            # Get recent chat history for context
            recent_messages = db.query(ChatMessage).filter(
                ChatMessage.chat_session_id == chat_session_id
            ).order_by(ChatMessage.timestamp.desc()).limit(10).all()
            
            # Build context for AI
            context = self._build_chat_context(pdf_document, recent_messages)
            
            # Generate AI response
            ai_response = await self._generate_chat_response(context, user_message)
            
            # Save user message
            user_msg = ChatMessage(
                chat_session_id=chat_session_id,
                user_id=user_id,
                message_type="user",
                content=user_message,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(user_msg)
            
            # Save AI response
            ai_msg = ChatMessage(
                chat_session_id=chat_session_id,
                user_id=user_id,
                message_type="ai",
                content=ai_response.get("text", ""),
                has_code=ai_response.get("hasCode", False),
                has_chart=ai_response.get("hasChart", False),
                timestamp=datetime.now(timezone.utc)
            )
            db.add(ai_msg)
            
            # Update session activity
            chat_session.last_activity = datetime.now(timezone.utc)
            
            db.commit()
            
            return {
                "success": True,
                "response": ai_response
            }
            
        except Exception as e:
            db.rollback()
            raise ValueError(f"Chat failed: {str(e)}")

    def _build_chat_context(self, pdf_document: PDFDocument, 
                          recent_messages: list) -> str:
        """Build context for AI chat response"""
        context = f"""
        You are an AI tutor helping a student understand a PDF document.
        
        Document: {pdf_document.filename}
        Summary: {pdf_document.summary}
        
        Recent conversation:
        """
        
        # Add recent messages (reversed to show chronological order)
        for msg in reversed(recent_messages):
            role = "Student" if msg.message_type == "user" else "AI Tutor"
            context += f"\n{role}: {msg.content}"
        
        context += "\n\nPlease provide helpful, educational responses based on the document content."
        
        return context

    async def _generate_chat_response(self, context: str, user_message: str) -> Dict[str, Any]:
        """Generate AI response for chat"""
        try:
            full_prompt = f"{context}\n\nStudent: {user_message}\n\nAI Tutor:"
            
            response = await self.gemini_service.get_response(full_prompt)
            return response
            
        except Exception as e:
            return {
                "text": f"I'm sorry, I encountered an error: {str(e)}",
                "hasCode": False,
                "hasChart": False
            }

    def get_user_pdfs(self, db: Session, user_id: int) -> list:
        """Get list of user's uploaded PDFs"""
        pdfs = db.query(PDFDocument).filter(
            PDFDocument.user_id == user_id
        ).order_by(PDFDocument.upload_date.desc()).all()
        
        return [
            {
                "id": pdf.id,
                "filename": pdf.filename,
                "upload_date": pdf.upload_date.isoformat(),
                "file_size": pdf.file_size,
                "has_summary": bool(pdf.summary)
            }
            for pdf in pdfs
        ]

    def get_chat_sessions(self, db: Session, user_id: int) -> list:
        """Get user's chat sessions"""
        sessions = db.query(ChatSession).filter(
            ChatSession.user_id == user_id
        ).order_by(ChatSession.last_activity.desc()).all()
        
        return [
            {
                "id": session.id,
                "session_name": session.session_name,
                "pdf_filename": session.pdf_document.filename if session.pdf_document else None,
                "created_date": session.created_date.isoformat(),
                "last_activity": session.last_activity.isoformat(),
                "message_count": len(session.chat_messages)
            }
            for session in sessions
        ]
