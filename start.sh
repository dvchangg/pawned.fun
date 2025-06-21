#!/bin/bash

# Start the backend server
echo "Starting ChessLana backend server..."
npx tsx server/index.ts &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Start the frontend client
echo "Starting ChessLana frontend client..."
npx vite --host 0.0.0.0 --port 5173 &
CLIENT_PID=$!

# Keep script running
wait