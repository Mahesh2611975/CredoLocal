#!/bin/bash
# ═══════════════════════════════════════════════════════
#  Start backend + frontend together
#  Run: bash run.sh
# ═══════════════════════════════════════════════════════

BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BLUE}Starting MicroFinance Platform...${NC}"

# Kill existing on ports
kill $(lsof -t -i:8000) 2>/dev/null || true
kill $(lsof -t -i:5173) 2>/dev/null || true

# Backend
echo -e "${GREEN}Starting FastAPI backend on :8000${NC}"
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

sleep 2

# Frontend
echo -e "${GREEN}Starting React frontend on :5173${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "═══════════════════════════════════════"
echo "  Backend API:   http://localhost:8000"
echo "  API Docs:      http://localhost:8000/docs"
echo "  Frontend:      http://localhost:5173"
echo "═══════════════════════════════════════"
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
