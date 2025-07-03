"""
EduFlow LMS - Application Launcher
Simple launcher that imports the main application from main.py
"""

import uvicorn
from main import app

if __name__ == "__main__":
    # Run the application using the app from main.py
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 