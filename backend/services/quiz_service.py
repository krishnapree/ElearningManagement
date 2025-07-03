import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, Integer
from typing import List, Dict, Any

from models import Question, QuizAttempt, UserProgress, Achievement, ChatSession, ChatMessage, PDFDocument
from services.gemini_service import GeminiService

class QuizService:
    def __init__(self):
        self.questions_per_quiz = 5
        self.difficulty_weights = {"easy": 0.3, "medium": 0.5, "hard": 0.2}
        self.gemini_service = GeminiService()

    def generate_adaptive_quiz(self, db: Session, user_id: int, difficulty: str | None = None) -> List[Dict[str, Any]]:
        """
        Generate an adaptive quiz based on user's performance history and difficulty level.
        """
        try:
            # Get user's weak areas
            weak_topics = self._get_weak_topics(db, user_id)

            # If no history, get a general mix
            if not weak_topics:
                weak_topics = ['mathematics', 'science', 'programming', 'general']

            questions = []

            # Get questions from weak topics (70% of quiz)
            weak_questions_count = int(self.questions_per_quiz * 0.7)
            weak_questions = self._get_questions_by_topics(db, weak_topics, weak_questions_count, difficulty)
            questions.extend(weak_questions)

            # Fill remaining with random questions
            remaining_count = self.questions_per_quiz - len(questions)
            if remaining_count > 0:
                random_questions = self._get_random_questions(db, remaining_count, exclude_ids=[q['id'] for q in questions], difficulty=difficulty)
                questions.extend(random_questions)

            # Shuffle the final list
            random.shuffle(questions)

            return questions[:self.questions_per_quiz]

        except Exception as e:
            print(f"Error generating adaptive quiz: {e}")
            # Fallback to random questions
            return self._get_random_questions(db, self.questions_per_quiz, difficulty=difficulty)

    async def generate_pdf_based_quiz(self, db: Session, user_id: int, chat_session_id: int = None) -> List[Dict[str, Any]]:
        """
        Generate quiz questions based on PDF content and chat history.
        """
        try:
            print(f"🔍 Generating PDF-based quiz for user {user_id}, chat session {chat_session_id}")

            # Get the most recent chat session if not specified
            if not chat_session_id:
                print("📋 No chat session ID provided, finding most recent session")
                chat_session = db.query(ChatSession).filter(
                    ChatSession.user_id == user_id
                ).order_by(ChatSession.last_activity.desc()).first()
            else:
                print(f"📋 Looking for specific chat session {chat_session_id}")
                chat_session = db.query(ChatSession).filter(
                    ChatSession.id == chat_session_id,
                    ChatSession.user_id == user_id
                ).first()

            if not chat_session:
                print(f"❌ No chat session found for user {user_id}")
                return self.generate_adaptive_quiz(db, user_id)

            if not chat_session.pdf_document:
                print(f"❌ No PDF document associated with chat session {chat_session.id}")
                return self.generate_adaptive_quiz(db, user_id)

            # Get PDF content and chat history
            pdf_document = chat_session.pdf_document
            print(f"📄 Found PDF: {pdf_document.filename} (ID: {pdf_document.id})")
            print(f"📝 PDF Summary length: {len(pdf_document.summary or '')} characters")

            chat_messages = db.query(ChatMessage).filter(
                ChatMessage.chat_session_id == chat_session.id
            ).order_by(ChatMessage.timestamp.asc()).all()

            print(f"💬 Found {len(chat_messages)} chat messages for context")

            # Build context for AI question generation
            context = self._build_quiz_context(pdf_document, chat_messages)
            print(f"🧠 Built context with {len(context)} characters")

            # Generate questions using AI
            questions = await self._generate_ai_questions(context)
            print(f"✅ Generated {len(questions)} questions")

            return questions

        except Exception as e:
            print(f"❌ Error generating PDF-based quiz: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to regular adaptive quiz
            return self.generate_adaptive_quiz(db, user_id)

    def _build_quiz_context(self, pdf_document: PDFDocument, chat_messages: list) -> str:
        """Build context for AI quiz generation"""

        # Build conversation context
        conversation_context = ""
        if chat_messages:
            conversation_context = "\n\nChat conversation about the document:"
            for msg in chat_messages:
                role = "Student" if msg.message_type == "user" else "AI Tutor"
                conversation_context += f"\n{role}: {msg.content[:500]}..."  # Limit message length
        else:
            conversation_context = "\n\nNo chat conversation available. Generate questions based on the document summary."

        context = f"""You are an expert quiz generator. Create {self.questions_per_quiz} multiple-choice questions to test understanding of this PDF document.

DOCUMENT INFORMATION:
- Filename: {pdf_document.filename}
- Summary: {pdf_document.summary[:1000]}...

{conversation_context}

REQUIREMENTS:
1. Create questions that test comprehension of the document content
2. Include questions about key concepts, facts, and main ideas
3. Make questions challenging but fair
4. Ensure all options are plausible
5. Base questions on the actual content, not general knowledge

OUTPUT FORMAT:
Return ONLY a valid JSON array with {self.questions_per_quiz} questions. Each question must have this exact structure:

[
  {{
    "question_text": "Clear, specific question about the document content",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "The exact text of the correct option",
    "topic": "Main subject area (e.g., Technology, Science, Business, etc.)"
  }}
]

IMPORTANT: Return ONLY the JSON array, no other text or formatting."""

        return context

    async def _generate_ai_questions(self, context: str) -> List[Dict[str, Any]]:
        """Generate quiz questions using AI with enhanced error handling"""
        try:
            print(f"Generating AI questions with context length: {len(context)}")

            response = await self.gemini_service.get_response(context)
            ai_text = response.get("text", "")

            print(f"AI Response received: {ai_text[:200]}...")  # Debug log

            if not ai_text:
                print("Empty AI response received")
                return self._create_fallback_questions()

            # Try to parse JSON from AI response
            import json
            import re

            # Clean the response - remove any markdown formatting
            cleaned_text = ai_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()

            # Extract JSON array from response
            json_match = re.search(r'\[.*\]', cleaned_text, re.DOTALL)
            if json_match:
                try:
                    questions_data = json.loads(json_match.group())
                    print(f"Successfully parsed {len(questions_data)} questions from AI")

                    if not isinstance(questions_data, list):
                        print("AI response is not a list")
                        return self._create_content_based_fallback()

                    # Format questions for frontend
                    formatted_questions = []
                    for i, q_data in enumerate(questions_data[:self.questions_per_quiz]):
                        if not isinstance(q_data, dict):
                            continue

                        question = {
                            "id": f"ai_generated_{i}",
                            "topic": q_data.get("topic", "PDF Content"),
                            "question_text": q_data.get("question_text", ""),
                            "correct_answer": q_data.get("correct_answer", ""),
                            "options": q_data.get("options", [])
                        }

                        # Validate question has all required fields
                        if (question["question_text"] and
                            question["correct_answer"] and
                            len(question["options"]) >= 2):
                            formatted_questions.append(question)

                    if formatted_questions:
                        print(f"Successfully formatted {len(formatted_questions)} valid questions")
                        return formatted_questions
                    else:
                        print("No valid questions found in AI response")
                        return self._create_content_based_fallback()

                except json.JSONDecodeError as e:
                    print(f"JSON parsing error: {e}")
                    return self._create_content_based_fallback()
            else:
                print("No JSON array found in AI response")
                return self._create_content_based_fallback()

        except Exception as e:
            print(f"Error generating AI questions: {e}")
            return self._create_content_based_fallback()

    def _create_fallback_questions(self) -> List[Dict[str, Any]]:
        """Create fallback questions when AI generation fails"""
        return [
            {
                "id": "fallback_1",
                "topic": "PDF Content",
                "question_text": "Based on the document you uploaded, what was the main topic discussed?",
                "correct_answer": "Please review the document summary",
                "options": [
                    "Please review the document summary",
                    "The document was not processed correctly",
                    "Unable to determine from the content",
                    "Multiple topics were covered"
                ]
            }
        ]

    def _create_content_based_fallback(self) -> List[Dict[str, Any]]:
        """Create better fallback questions that encourage learning"""
        return [
            {
                "id": "content_fallback_1",
                "topic": "Document Analysis",
                "question_text": "What is the most effective way to understand a complex document?",
                "correct_answer": "Read carefully and take notes on key concepts",
                "options": [
                    "Read carefully and take notes on key concepts",
                    "Skim through quickly without stopping",
                    "Only read the first and last paragraphs",
                    "Focus only on highlighted text"
                ]
            },
            {
                "id": "content_fallback_2",
                "topic": "Learning Strategy",
                "question_text": "When studying from a PDF document, what should you do first?",
                "correct_answer": "Review the summary and identify main topics",
                "options": [
                    "Review the summary and identify main topics",
                    "Start reading from the middle",
                    "Look only at images and charts",
                    "Read the conclusion first"
                ]
            },
            {
                "id": "content_fallback_3",
                "topic": "Comprehension",
                "question_text": "How can you test your understanding of a document?",
                "correct_answer": "Ask yourself questions about the content",
                "options": [
                    "Ask yourself questions about the content",
                    "Memorize the first paragraph",
                    "Count the number of pages",
                    "Focus only on the title"
                ]
            }
        ]

    def _get_weak_topics(self, db: Session, user_id: int, limit: int = 3) -> List[str]:
        """
        Identify user's weak topics based on performance.
        """
        try:
            # Get topics with low accuracy rates
            topic_stats = db.query(
                Question.topic,
                func.count(QuizAttempt.id).label('total'),
                func.sum(func.cast(QuizAttempt.is_correct, db.bind.dialect.INTEGER)).label('correct')
            ).join(
                QuizAttempt, Question.id == QuizAttempt.question_id
            ).filter(
                QuizAttempt.user_id == user_id
            ).group_by(
                Question.topic
            ).having(
                func.count(QuizAttempt.id) >= 3  # At least 3 attempts
            ).all()

            # Calculate accuracy and sort by worst performance
            weak_topics = []
            for topic, total, correct in topic_stats:
                accuracy = (correct or 0) / total if total > 0 else 0
                if accuracy < 0.7:  # Less than 70% accuracy
                    weak_topics.append((topic, accuracy))

            # Sort by accuracy (worst first) and return topic names
            weak_topics.sort(key=lambda x: x[1])
            return [topic for topic, _ in weak_topics[:limit]]

        except Exception as e:
            print(f"Error getting weak topics: {e}")
            return []

    def _get_questions_by_topics(self, db: Session, topics: List[str], count: int, difficulty: str | None = None) -> List[Dict[str, Any]]:
        """
        Get questions from specific topics with optional difficulty filter.
        """
        try:
            query = db.query(Question).filter(Question.topic.in_(topics))

            if difficulty:
                query = query.filter(Question.difficulty == difficulty)

            questions = query.order_by(func.random()).limit(count).all()

            return [self._format_question(q) for q in questions]

        except Exception as e:
            print(f"Error getting questions by topics: {e}")
            return []

    def _get_random_questions(self, db: Session, count: int, exclude_ids: List[int] | None = None, difficulty: str | None = None) -> List[Dict[str, Any]]:
        """
        Get random questions from the database with optional difficulty filter.
        """
        try:
            query = db.query(Question)

            if exclude_ids:
                query = query.filter(~Question.id.in_(exclude_ids))

            if difficulty:
                query = query.filter(Question.difficulty == difficulty)

            questions = query.order_by(func.random()).limit(count).all()

            return [self._format_question(q) for q in questions]

        except Exception as e:
            print(f"Error getting random questions: {e}")
            return []

    def _format_question(self, question: Question) -> Dict[str, Any]:
        """
        Format a question for the frontend.
        """
        return {
            "id": question.id,
            "topic": question.topic,
            "question_text": question.question_text,
            "correct_answer": question.correct_answer,
            "options": question.options
        }

    def submit_quiz_results(self, db: Session, user_id: int, answers: List[Dict[str, Any]]) -> None:
        """
        Submit quiz results and update user progress.
        """
        try:
            correct_count = 0

            for answer in answers:
                question_id = answer.get('questionId')
                is_correct = answer.get('isCorrect', False)

                if is_correct:
                    correct_count += 1

                # Record the attempt
                attempt = QuizAttempt(
                    user_id=user_id,
                    question_id=question_id,
                    is_correct=is_correct,
                    timestamp=datetime.now(timezone.utc)
                )
                db.add(attempt)

            # Update user progress
            self._update_user_progress(db, user_id, answers)

            # Check for achievements
            self._check_achievements(db, user_id, correct_count, len(answers))

            db.commit()

        except Exception as e:
            print(f"Error submitting quiz results: {e}")
            db.rollback()
            raise

    def _update_user_progress(self, db: Session, user_id: int, answers: List[Dict]):
        """
        Update user progress statistics.
        """
        try:
            # Group answers by topic
            topic_stats = {}

            for answer in answers:
                question = db.query(Question).filter(Question.id == answer.get('questionId')).first()
                if not question:
                    continue

                topic = question.topic
                if topic not in topic_stats:
                    topic_stats[topic] = {'total': 0, 'correct': 0}

                topic_stats[topic]['total'] += 1
                if answer.get('isCorrect', False):
                    topic_stats[topic]['correct'] += 1

            # Update progress for each topic
            for topic, stats in topic_stats.items():
                progress = db.query(UserProgress).filter(
                    UserProgress.user_id == user_id,
                    UserProgress.topic == topic
                ).first()

                if not progress:
                    progress = UserProgress(
                        user_id=user_id,
                        topic=topic,
                        total_questions=stats['total'],
                        correct_answers=stats['correct'],
                        last_activity=datetime.now(timezone.utc)
                    )
                    db.add(progress)
                else:
                    progress.total_questions += stats['total']
                    progress.correct_answers += stats['correct']
                    progress.last_activity = datetime.now(timezone.utc)  # type: ignore

            # Update streak
            self._update_streak(db, user_id)

        except Exception as e:
            print(f"Error updating user progress: {e}")

    def _update_streak(self, db: Session, user_id: int):
        """
        Update user's learning streak.
        """
        try:
            today = datetime.now(timezone.utc).date()
            yesterday = today - timedelta(days=1)

            # Check if user had activity yesterday
            yesterday_activity = db.query(QuizAttempt).filter(
                QuizAttempt.user_id == user_id,
                func.date(QuizAttempt.timestamp) == yesterday
            ).first()

            # Get user's progress record (or create one)
            progress = db.query(UserProgress).filter(
                UserProgress.user_id == user_id
            ).first()

            if not progress:
                progress = UserProgress(
                    user_id=user_id,
                    topic='general',
                    streak_days=1,
                    best_streak=1
                )
                db.add(progress)
            else:
                if yesterday_activity:
                    # Continue streak
                    progress.streak_days += 1  # type: ignore
                else:
                    # Reset streak
                    progress.streak_days = 1  # type: ignore

                # Update best streak
                if progress.streak_days > progress.best_streak:  # type: ignore
                    progress.best_streak = progress.streak_days  # type: ignore

        except Exception as e:
            print(f"Error updating streak: {e}")

    def _check_achievements(self, db: Session, user_id: int, correct_count: int, total_count: int):
        """
        Check and award achievements based on performance.
        """
        try:
            achievements_to_award = []

            # Perfect score achievement
            if correct_count == total_count and total_count >= 5:
                achievements_to_award.append({
                    'type': 'perfect_score',
                    'title': 'Perfect Score!',
                    'description': f'Got all {total_count} questions correct in a quiz',
                    'icon': 'fa-star'
                })

            # First quiz achievement
            previous_attempts = db.query(QuizAttempt).filter(
                QuizAttempt.user_id == user_id
            ).count()

            if previous_attempts <= total_count:  # This is likely their first quiz
                achievements_to_award.append({
                    'type': 'first_quiz',
                    'title': 'Quiz Beginner',
                    'description': 'Completed your first quiz',
                    'icon': 'fa-graduation-cap'
                })

            # Award achievements
            for achievement_data in achievements_to_award:
                # Check if already awarded
                existing = db.query(Achievement).filter(
                    Achievement.user_id == user_id,
                    Achievement.achievement_type == achievement_data['type']
                ).first()

                if not existing:
                    achievement = Achievement(
                        user_id=user_id,
                        achievement_type=achievement_data['type'],
                        title=achievement_data['title'],
                        description=achievement_data['description'],
                        icon=achievement_data['icon'],
                        earned_date=datetime.now(timezone.utc)
                    )
                    db.add(achievement)

        except Exception as e:
            print(f"Error checking achievements: {e}")

    def get_dashboard_data(self, db: Session, user_id: int, range_str: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """
        Get dashboard data with pagination support
        """
        # Calculate date range
        today = datetime.now(timezone.utc).date()
        if range_str == "week":
            start_date = today - timedelta(days=7)
        elif range_str == "month":
            start_date = today - timedelta(days=30)
        elif range_str == "year":
            start_date = today - timedelta(days=365)
        else:
            start_date = today - timedelta(days=7)  # Default to week

        # Get overall statistics
        total_attempts = db.query(func.count(QuizAttempt.id)).filter(
            QuizAttempt.user_id == user_id,
            func.date(QuizAttempt.timestamp) >= start_date
        ).scalar()

        correct_attempts = db.query(func.count(QuizAttempt.id)).filter(
            QuizAttempt.user_id == user_id,
            QuizAttempt.is_correct == True,
            func.date(QuizAttempt.timestamp) >= start_date
        ).scalar()

        overall_score = int((correct_attempts / total_attempts * 100)) if total_attempts > 0 else 0

        # Get recent activity
        recent_activity = self._get_recent_activity(db, user_id, start_date)

        # Get topic performance
        topic_performance = self._get_topic_performance(db, user_id, start_date)

        # Get streak information
        streak = self._get_current_streak(db, user_id)

        # Get achievements
        achievements = self._get_user_achievements(db, user_id)

        return {
            "overall_score": overall_score,
            "total_questions": total_attempts,
            "correct_answers": correct_attempts,
            "recent_activity": recent_activity,
            "topic_performance": topic_performance,
            "streak": streak,
            "achievements": achievements
        }

    def _get_recent_activity(self, db: Session, user_id: int, start_date: datetime) -> List[Dict[str, Any]]:
        """
        Get recent quiz activity for charts.
        """
        try:
            # Group attempts by date and calculate daily scores
            daily_stats = db.query(
                func.date(QuizAttempt.timestamp).label('date'),
                func.count(QuizAttempt.id).label('total'),
                func.sum(func.cast(QuizAttempt.is_correct, Integer)).label('correct')
            ).filter(
                QuizAttempt.user_id == user_id,
                QuizAttempt.timestamp >= start_date
            ).group_by(
                func.date(QuizAttempt.timestamp)
            ).order_by('date').all()

            activity = []
            for date, total, correct in daily_stats:
                score = int((correct or 0) / total * 100) if total > 0 else 0
                activity.append({
                    "date": date.isoformat(),
                    "score": score,
                    "topic": "Mixed"  # Could be enhanced to show dominant topic
                })

            return activity

        except Exception as e:
            print(f"Error getting recent activity: {e}")
            return []

    def _get_topic_performance(self, db: Session, user_id: int, start_date: datetime) -> List[Dict[str, Any]]:
        """
        Get performance breakdown by topic.
        """
        try:
            topic_stats = db.query(
                Question.topic,
                func.count(QuizAttempt.id).label('total'),
                func.sum(func.cast(QuizAttempt.is_correct, Integer)).label('correct')
            ).join(
                QuizAttempt, Question.id == QuizAttempt.question_id
            ).filter(
                QuizAttempt.user_id == user_id,
                QuizAttempt.timestamp >= start_date
            ).group_by(
                Question.topic
            ).all()

            performance = []
            for topic, total, correct in topic_stats:
                percentage = int((correct or 0) / total * 100) if total > 0 else 0
                performance.append({
                    "topic": topic.title(),
                    "correct": correct or 0,
                    "total": total,
                    "percentage": percentage
                })

            return performance

        except Exception as e:
            print(f"Error getting topic performance: {e}")
            return []

    def _get_current_streak(self, db: Session, user_id: int) -> int:
        """
        Get user's current learning streak.
        """
        try:
            progress = db.query(UserProgress).filter(
                UserProgress.user_id == user_id
            ).first()

            return progress.streak_days if progress else 0  # type: ignore

        except Exception as e:
            print(f"Error getting current streak: {e}")
            return 0

    def _get_user_achievements(self, db: Session, user_id: int) -> List[Dict[str, Any]]:
        """
        Get user's achievements.
        """
        try:
            achievements = db.query(Achievement).filter(
                Achievement.user_id == user_id
            ).order_by(desc(Achievement.earned_date)).all()

            return [{
                "id": str(achievement.id),
                "title": achievement.title,
                "description": achievement.description,
                "earned_date": achievement.earned_date.isoformat(),  # type: ignore
                "icon": achievement.icon
            } for achievement in achievements]

        except Exception as e:
            print(f"Error getting user achievements: {e}")
            return []

