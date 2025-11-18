#!/bin/bash

# LearnToRecite - Quick Start Script

echo "📖 LearnToRecite - Starting local server..."
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "Using Python 3 HTTP server..."
    echo "Server will be available at: http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server 8000
# Check if Python 2 is available
elif command -v python &> /dev/null; then
    echo "Using Python 2 HTTP server..."
    echo "Server will be available at: http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python -m SimpleHTTPServer 8000
# Check if Node.js http-server is available
elif command -v npx &> /dev/null; then
    echo "Using Node.js http-server..."
    echo "Server will be available at: http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    npx http-server -p 8000
else
    echo "❌ Error: No suitable server found."
    echo ""
    echo "Please install one of the following:"
    echo "  - Python 3 (recommended): python3 -m http.server 8000"
    echo "  - Node.js: npx http-server -p 8000"
    echo ""
    echo "Or simply open index.html directly in your browser."
    exit 1
fi

