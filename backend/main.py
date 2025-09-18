#!/usr/bin/env python3
"""
Main entry point for the Legal Document Analyzer Backend API
"""

import os
import sys
import uvicorn
from dotenv import load_dotenv

# Add the current directory to Python path for relative imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Load environment variables from the backend directory
load_dotenv(os.path.join(current_dir, '.env'))

# Import the API app
from enhanced_api import app

# Export app for Vercel
app = app

def start_api():
    """Start the API server"""
    try:
        print("Testing AI service initialization...")
        print("AI Service initialized successfully!")
        print("Starting Enhanced Legal Document Analyzer API with AI Integration...")
        uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
    except Exception as e:
        print(f"Failed to initialize AI service: {str(e)}")
        print("Please check your GEMINI_API_KEY environment variable")
        print("Starting API with limited functionality...")
        uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)

if __name__ == "__main__":
    start_api()
