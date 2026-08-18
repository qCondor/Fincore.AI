#!/bin/bash
# Fincore.AI startup script

echo "=== Starting Fincore.AI ==="

# Start backend
echo "Starting backend server..."
cd my-agent
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

echo "Backend running on http://localhost:8000 (PID: $BACKEND_PID)"
echo ""
echo "To expose to internet, run: ngrok http 8000"
echo "Then update expo-app/config.ts with your ngrok URL"
echo ""

# Start Expo with tunnel
echo "Starting Expo app with tunnel mode..."
cd expo-app
npx expo start --tunnel

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
