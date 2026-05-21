# MicroFinance Platform
**AI-powered · Blockchain-audited · Privacy-first SMS processing**

---

## Project Structure
```
microfinance-platform/
├── backend/                    FastAPI + Python
│   ├── app/
│   │   ├── main.py             Entry point
│   │   ├── database.py         SQLAlchemy + PostgreSQL
│   │   ├── models/models.py    All DB tables
│   │   ├── routers/
│   │   │   ├── auth.py         Register / Login / JWT
│   │   │   ├── applications.py Full loan workflow
│   │   │   └── lenders.py      Lender CRUD + seed
│   │   └── services/
│   │       ├── ai_service.py   ← ML inference (your .pkl models)
│   │       ├── emi_service.py  EMI calculation engine
│   │       ├── lender_service.py Lender matching
│   │       ├── blockchain_service.py Polygon write
│   │       ├── s3_service.py   AWS S3 uploads
│   │       └── auth_service.py JWT helpers
│   ├── ml_models/              ← DROP YOUR 5 .pkl FILES HERE
│   └── requirements.txt
│
├── frontend/                   React + Vite
│   └── src/
│       ├── pages/
│       │   ├── Landing.jsx
│       │   ├── Register.jsx / Login.jsx
│       │   ├── ApplyForm.jsx       Step 1+2: form + file upload
│       │   ├── EligibilityResult.jsx  AI scores + charts
│       │   ├── EMISelection.jsx    Slider + EMI picker
│       │   ├── LenderSelection.jsx Matched lenders
│       │   ├── MyApplications.jsx  Applicant tracking
│       │   ├── LenderDashboard.jsx Full analytics + actions
│       │   └── VendorDashboard.jsx Simple mobile vendor UI
│       └── services/
│           └── smsProcessor.js  On-device SMS feature extraction
│
└── contracts/                  Solidity + Hardhat
    └── contracts/LoanApplicationContract.sol
```

---

## STEP-BY-STEP SETUP

### Prerequisites
```bash
node --version    # Need 18+
python3 --version # Need 3.10+
psql --version    # Need PostgreSQL running
```

### Step 1: Create PostgreSQL database
```bash
psql -U postgres
CREATE DATABASE microfinance;
\q
```

### Step 2: Backend setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env
```

**Edit `backend/.env`:**
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/microfinance
JWT_SECRET=some-long-random-string-change-this
```
> AWS, Blockchain keys are optional — app works without them.

### Step 3: Place your ML models
```bash
# Copy all 5 pkl files into:
backend/ml_models/lgbm_credit_model.pkl
backend/ml_models/isolation_forest_model.pkl
backend/ml_models/isolation_forest_scaler.pkl
backend/ml_models/gbr_loan_model.pkl
backend/ml_models/label_encoder_business.pkl
```

### Step 4: Run backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
Backend will auto-create all tables on first run.
API docs: http://localhost:8000/docs

### Step 5: Seed demo lenders (run once)
```bash
curl -X POST http://localhost:8000/api/lenders/seed
```
This creates 4 demo lenders: MudraMFI, FinGrow Capital, Grameen Saathi, SwiftLoan MFI.

### Step 6: Frontend setup
```bash
cd frontend
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:8000/api
npm run dev
```
Frontend: http://localhost:5173

### Step 7 (Optional): Smart contracts
```bash
cd contracts
npm install
npx hardhat compile

# Deploy to local test node:
npx hardhat node                        # Terminal A
npx hardhat run scripts/deploy.js --network localhost  # Terminal B

# Deploy to Polygon Mumbai (need test MATIC from faucet.polygon.technology):
npx hardhat run scripts/deploy.js --network mumbai
# Copy the printed address into backend/.env CONTRACT_ADDRESS=0x...
```

---

## Quick Run (after setup)
```bash
# Terminal 1
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2
cd frontend && npm run dev

# Or use the script:
bash run.sh
```

---

## Test the AI endpoint directly
```bash
curl -X POST http://localhost:8000/api/applications/analyze \
  -F "csv_file=@transactions.csv" \
  -F "cibil_file=@CIBIL_Report.html" \
  -F "declared_monthly_income=45000" \
  -F "years_in_business=2.5" \
  -F "city_tier=3" \
  -F "business_type=Kirana/Grocery" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## User Flow

| Role | URL | What they do |
|------|-----|-------------|
| Applicant | `/register` | Create account |
| Applicant | `/apply` | Fill form + upload CSV + CIBIL HTML |
| Applicant | `/eligibility` | See AI trust score, risk, safe loan |
| Applicant | `/emi-selection` | Slider + choose EMI plan |
| Applicant | `/lender-selection` | Pick matched lender + submit |
| Applicant | `/my-applications` | Track status |
| Applicant | `/vendor` | Simple mobile dashboard |
| Lender | `/register?role=lender` | Create lender account |
| Lender | `/lender-dashboard` | See all applications, AI analytics, approve/reject |

---

## SMS Privacy Design

### Problem
Vendors use SMS-based bank transaction data for credit scoring. Raw SMS must never leave the device.

### Solution: On-Device Feature Extraction

**File:** `frontend/src/services/smsProcessor.js`

#### Processing Pipeline (runs 100% on-device)

```
Raw SMS Array
     │
     ▼
[FILTER 1] Remove OTP / sensitive messages
  Pattern match: "OTP", "one-time password", "do not share"
  → Hard exclude — never processed
     │
     ▼
[FILTER 2] Keep only financial bank SMS
  Must contain credit/debit patterns + currency symbols
  → Non-bank messages dropped
     │
     ▼
[EXTRACT] Pull numeric amounts only
  Regex extracts: amount (float)
  NO merchant names, NO account numbers, NO message text stored
     │
     ▼
[AGGREGATE] Monthly bucketing
  Group by YYYY-MM → sum credits, sum debits
  Single entry per month — not per transaction
     │
     ▼
[FEATURES] Compute ML features
  avg_monthly_credit, std_monthly_credit,
  avg_monthly_debit, avg_txn_frequency_per_month,
  max_single_debit, detected_emi_amount
     │
     ▼
Transmit ONLY these 6 numbers + monthly chart (amounts only)
```

#### What IS transmitted
```json
{
  "avg_monthly_credit": 42000,
  "std_monthly_credit": 5200,
  "avg_monthly_debit": 31000,
  "avg_txn_frequency_per_month": 28,
  "max_single_debit": 18000,
  "detected_emi_amount": 4500,
  "monthly_summary": [
    {"month": "2024-01", "credit": 41000, "debit": 30000},
    ...
  ],
  "privacy": {
    "raw_sms_transmitted": false,
    "otp_messages_filtered": true,
    "processing_location": "on_device",
    "features_only": true
  }
}
```

#### What is NEVER transmitted
- Any message text or body
- Sender names (bank names, merchant names)
- Account numbers or card numbers
- OTP messages (hard filtered before processing)
- Individual transaction timestamps
- Recipient/merchant identifiers

#### Security guarantees
1. **Hard OTP filter** — any message matching OTP patterns is skipped before any other processing
2. **Amount extraction only** — only `parseFloat()` of matched regex groups, not message strings
3. **Monthly aggregation** — individual transactions never leave device; only monthly sums
4. **Serialization check** — `serializeForTransmission()` strips all non-numeric fields before POST
5. **Privacy attestation** — transmitted payload includes signed proof of on-device processing

---

## Vendor Mobile Dashboard Design

**URL:** `/vendor` (mobile-optimized, max-width 420px)

### Design Principles
- No financial jargon — "Loan Approved!" not "Sanction Status: Active"
- 4-tab bottom nav: Home / My Loan / Privacy / Help
- Everything in plain Hindi-English
- Large touch targets (48px+ buttons)
- Color-coded status (green = good, amber = waiting, red = issue)

### Tabs
| Tab | Content |
|-----|---------|
| 🏠 Home | Eligibility card, active loan summary, quick action buttons |
| 💰 My Loan | All applications list, progress bar, EMI repayment schedule |
| 🔒 Privacy | SMS permission toggle, explanation of what's shared, audit |
| ❓ Help | 7 plain-language FAQs + WhatsApp support button |

---

## Deployment

| Layer | Platform | Command |
|-------|----------|---------|
| Frontend | Vercel | `cd frontend && npx vercel --prod` |
| Backend | Render / EC2 | `pip install -r requirements.txt && uvicorn app.main:app` |
| Database | Neon / Supabase | Copy DATABASE_URL into .env |
| Blockchain | Polygon Mumbai | `npx hardhat run scripts/deploy.js --network mumbai` |
| Files | AWS S3 | Add keys to .env |
