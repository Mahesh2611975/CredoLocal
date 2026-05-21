#!/bin/bash
# ═══════════════════════════════════════════════════════
#  MicroFinance Platform — One-command setup
#  Run: bash setup.sh
# ═══════════════════════════════════════════════════════

set -e
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  MicroFinance Platform Setup             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"

# ── 1. Backend ─────────────────────────────────────────
echo -e "\n${GREEN}[1/5] Setting up Python backend...${NC}"
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt --quiet
cp .env.example .env
echo -e "${YELLOW}  ⚠  Edit backend/.env with your DB credentials${NC}"
cd ..

# ── 2. Frontend ────────────────────────────────────────
echo -e "\n${GREEN}[2/5] Installing frontend dependencies...${NC}"
cd frontend
npm install --silent
cp .env.example .env
cd ..

# ── 3. Contracts ───────────────────────────────────────
echo -e "\n${GREEN}[3/5] Installing smart contract dependencies...${NC}"
cd contracts
npm install --silent
cd ..

# ── 4. ML Models check ─────────────────────────────────
echo -e "\n${GREEN}[4/5] Checking ML models...${NC}"
MODELS=(
  "lgbm_credit_model.pkl"
  "isolation_forest_model.pkl"
  "isolation_forest_scaler.pkl"
  "gbr_loan_model.pkl"
  "label_encoder_business.pkl"
)
for m in "${MODELS[@]}"; do
  if [ -f "backend/ml_models/$m" ]; then
    echo -e "  ✅ $m"
  else
    echo -e "  ${YELLOW}⚠  MISSING: backend/ml_models/$m${NC}"
  fi
done

# ── 5. Done ────────────────────────────────────────────
echo -e "\n${GREEN}[5/5] Setup complete!${NC}"
echo -e ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Edit  ${YELLOW}backend/.env${NC}  (add DB URL, AWS keys)"
echo -e "  2. Place .pkl files in  ${YELLOW}backend/ml_models/${NC}"
echo -e "  3. Run:  ${YELLOW}bash run.sh${NC}"
