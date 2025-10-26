#!/usr/bin/env python3
"""
Simple script to start the backend server
Make sure to install dependencies first: pip install -r requirements.txt
"""

import subprocess
import sys
import os

def main():
    # Check if requirements are installed
    try:
        import flask
        import flask_cors
        import groq
        import dotenv
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Please install requirements: pip install -r requirements.txt")
        sys.exit(1)
    
    # Check for GROQ_API_KEY
    if not os.getenv("GROQ_API_KEY"):
        print("Warning: GROQ_API_KEY environment variable not set")
        print("Please set it in your .env file or environment")
    
    print("Starting backend server...")
    print("Server will be available at: http://localhost:5000")
    print("API endpoint: http://localhost:5000/api/generate-signal")
    print("Health check: http://localhost:5000/api/health")
    print("\nPress Ctrl+C to stop the server")
    
    # Start the server
    try:
        here = os.path.dirname(os.path.abspath(__file__))
        index_path = os.path.join(here, "index.py")
        # Run index.py from the backend folder to ensure relative imports/paths work
        subprocess.run([sys.executable, index_path], check=True, cwd=here)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"Server failed to start: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
