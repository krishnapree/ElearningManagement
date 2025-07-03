import os
import re
import json
import google.generativeai as genai
from typing import Dict, Any, Optional, List

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")

        # Configure the Gemini API
        genai.configure(api_key=api_key)

        # Get the model (using the latest available model)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

        # System prompt for AI tutor
        self.system_prompt = """
        You are an AI tutor specialized in helping students learn various subjects.
        Your responses should be:

        1. Educational and informative
        2. Clear and concise
        3. Engaging and encouraging
        4. Accurate and factual

        FORMATTING GUIDELINES - IMPORTANT:
        - Use **bold** for important terms, concepts, and headings
        - Use ## for main section headings (e.g., ## Key Concepts)
        - Use ### for subsection headings (e.g., ### Example)
        - Use numbered lists (1. 2. 3.) for step-by-step explanations
        - Use bullet points (- or *) for key features, benefits, or lists
        - Use `code` for technical terms or code snippets
        - Separate sections with proper spacing
        - Keep paragraphs concise and readable

        When explaining concepts:
        - Break down complex ideas into simpler parts
        - Use examples to illustrate points
        - Provide step-by-step explanations when appropriate
        - Include code snippets for programming questions (use markdown format with ```language syntax)

        If you're unsure about an answer, acknowledge the limitations of your knowledge.

        For math equations, use LaTeX notation with $ symbols.
        """

    async def get_response(self, question: str) -> Dict[str, Any]:
        try:
            # Enhance the prompt with the system prompt
            enhanced_prompt = f"{self.system_prompt}\n\nStudent question: {question}"

            response = self.model.generate_content(enhanced_prompt)
            response_text = response.text

            # Parse response for code snippets and chart suggestions
            result = {
                "text": response_text,
                "hasCode": False,
                "codeSnippet": None,
                "language": None,
                "hasChart": False,
                "chartData": None
            }

            # Extract code snippets
            code_pattern = r'```(\w+)?\n(.*?)\n```'
            code_matches = re.findall(code_pattern, response_text, re.DOTALL)

            if code_matches:
                language, code = code_matches[0]
                result["hasCode"] = True
                result["codeSnippet"] = code.strip()
                result["language"] = language or "text"

                # Clean the response text to remove code blocks for better formatting
                result["text"] = re.sub(code_pattern, "[Code example provided below]", response_text, flags=re.DOTALL)

            # Look for chart suggestions in the response
            chart_patterns = [
                r'chart:\s*(\{.*?\})',
                r'chart data:\s*(\{.*?\})',
                r'chartData:\s*(\{.*?\})'
            ]

            for pattern in chart_patterns:
                chart_matches = re.search(pattern, response_text, re.DOTALL | re.IGNORECASE)
                if chart_matches:
                    try:
                        chart_data = json.loads(chart_matches.group(1))
                        result["hasChart"] = True
                        result["chartData"] = chart_data
                        break
                    except json.JSONDecodeError:
                        pass

            return result
        except Exception as e:
            print(f"Error in Gemini service: {str(e)}")
            raise Exception(f"Failed to get AI response: {str(e)}")

    def _generate_sample_chart_data(self, question: str) -> Optional[List[Dict[str, Any]]]:
        """
        Generate sample data structure for charts based on question context.
        This is a placeholder - in a real implementation, you might use the AI
        to generate actual data or connect to real data sources.
        """
        # Determine chart type based on question keywords
        question_lower = question.lower()

        if any(keyword in question_lower for keyword in ["trend", "time", "over time", "progress"]):
            # Time series data
            return [
                {"date": "2024-01-01", "value": 65},
                {"date": "2024-01-02", "value": 72},
                {"date": "2024-01-03", "value": 68},
                {"date": "2024-01-04", "value": 75},
                {"date": "2024-01-05", "value": 78}
            ]
        elif any(keyword in question_lower for keyword in ["compare", "comparison", "vs", "versus"]):
            # Comparison data
            return [
                {"category": "Option A", "value": 85},
                {"category": "Option B", "value": 72},
                {"category": "Option C", "value": 91},
                {"category": "Option D", "value": 68}
            ]
        else:
            # Generic data
            return [
                {"label": "Category 1", "value": 30},
                {"label": "Category 2", "value": 45},
                {"label": "Category 3", "value": 25}
            ]

    async def generate_explanation_with_examples(self, topic: str) -> str:
        """
        Generate a detailed explanation with examples for a given topic.
        """
        try:
            prompt = f"""
            Provide a comprehensive educational explanation of "{topic}" that includes:
            1. A clear definition
            2. Key concepts and principles
            3. Real-world examples
            4. Common misconceptions to avoid
            5. How it relates to other concepts

            Make it suitable for a learning platform - educational but engaging.
            """

            response = self.model.generate_content(prompt)
            return response.text

        except Exception:
            return f"I'm sorry, I couldn't generate an explanation for '{topic}' at the moment. Please try again later."

    async def analyze_learning_pattern(self, user_history: List[Dict[str, Any]]) -> str:
        """
        Analyze user's learning patterns and provide personalized recommendations.
        """
        try:
            # Convert history to a summary
            topics = [item.get('topic', 'Unknown') for item in user_history]
            scores = [item.get('score', 0) for item in user_history]

            avg_score = sum(scores) / len(scores) if scores else 0

            prompt = f"""
            Analyze this learning pattern and provide recommendations:

            Topics studied: {', '.join(topics)}
            Average score: {avg_score:.1f}%
            Number of sessions: {len(user_history)}

            Please provide:
            1. Strengths identified
            2. Areas for improvement
            3. Recommended next topics
            4. Study strategies

            Keep it encouraging and actionable.
            """

            response = self.model.generate_content(prompt)
            return response.text

        except Exception:
            return "I'm working on analyzing your learning patterns. Please continue learning, and I'll have insights for you soon!"



