# MicroFinance Platform

> **AI-powered · Blockchain-audited · Privacy-first**
> Full-stack microfinance underwriting platform for small businesses in India.

---

## What This Project Does

Small businesses in India — kirana shops, textile traders, food vendors — struggle to get loans because traditional banks require years of paperwork and reject applicants with no formal credit history. This platform solves that.

A vendor uploads their bank transactions CSV and CIBIL report HTML. In seconds, a 3-model AI stack analyzes 20+ financial signals and returns a trust score, default probability, eligible loan amount, and matched lenders. The vendor picks a lender and EMI plan, submits the application, and the lender reviews a full analytics dashboard to approve, reject, or modify the offer. Every key action is cryptographically hashed and written to the Polygon blockchain as an immutable audit trail.

---

## Table of Contents

1. [Features Overview](#features-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [User Roles](#user-roles)
5. [User Flow — Step by Step](#user-flow)
6. [AI Underwriting Engine](#ai-underwriting-engine)
7. [SMS Privacy Design](#sms-privacy-design)
8. [EMI Calculation Engine](#emi-calculation-engine)
9. [Lender Matching Engine](#lender-matching-engine)
10. [Blockchain Audit Layer](#blockchain-audit-layer)
11. [Vendor Mobile Dashboard](#vendor-mobile-dashboard)
12. [Frontend Pages](#frontend-pages)
13. [Backend API Reference](#backend-api-reference)
14. [Database Schema](#database-schema)
15. [Setup & Run — Complete Commands](#setup--run)
16. [Environment Variables](#environment-variables)
17. [Deployment](#deployment)
18. [Business Rules](#business-rules)

---

## Features Overview

### For Loan Applicants (Business Owners)
| Feature | Description |
|---------|-------------|
| AI Eligibility Check | Upload CSV + CIBIL HTML → get trust score, risk category, and max loan amount in seconds |
| Interactive EMI Slider | Drag to choose loan amount (up to AI max), see EMI recalculate live for 5 tenure options |
| Lender Matching | Platform shows only lenders whose rules match your business type, city, risk score |
| Application Tracking | Real-time status timeline from Submitted → Under Review → Decision |
| Vendor Mobile Dashboard | Simple mobile-first UI — no jargon, shows only what matters |
| SMS-based Credit Scoring | On-device SMS processing extracts income/expense features without raw SMS leaving phone |

### For Lenders (Microfinance Institutions)
| Feature | Description |
|---------|-------------|
| Full Analytics Dashboard | Cash flow charts, CIBIL breakdown, ratio bars, anomaly flags — all from AI report |
| Application Queue | Sidebar list of all applications with risk badge and status |
| Approve / Reject / Modify | Take action with optional note, modified amount, or modified EMI |
| Request Documents | Trigger docs_requested status to ask applicant for more files |
| Blockchain Audit Trail | Every action recorded on Polygon with tx hash visible in dashboard |

### Platform-wide
| Feature | Description |
|---------|-------------|
| JWT Authentication | Secure login with role-based access (applicant / lender / admin) |
| AWS S3 File Storage | Uploaded CSVs and CIBIL reports encrypted at rest in S3 |
| Blockchain Audit | Application hashes + status changes written to Polygon smart contract |
| Graceful Degradation | Platform works fully without S3 or blockchain configured — optional services |
| Seed Data | One API call seeds 4 demo lenders with realistic rules and interest rates |

---

## Tech Stack

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| React | 18.3 | UI framework |
| Vite | 5.2 | Dev server + build |
| React Router | 6.23 | Client-side routing |
| Axios | 1.7 | HTTP client with JWT interceptors |
| Chart.js + react-chartjs-2 | 4.4 | Cash flow bar charts, spend doughnut charts |
| Ethers.js | 6.12 | Blockchain wallet interaction |
| Context API | built-in | Global state (AI result, selections, user) |
| Plain CSS | — | Custom dark theme, no UI library |

### Backend
| Tool | Version | Purpose |
|------|---------|---------|
| FastAPI | 0.111 | REST API framework |
| Uvicorn | 0.29 | ASGI server |
| SQLAlchemy | 2.0 | ORM |
| Alembic | 1.13 | DB migrations |
| psycopg2-binary | 2.9 | PostgreSQL driver |
| python-jose | 3.3 | JWT tokens |
| passlib[bcrypt] | 1.7 | Password hashing |
| python-multipart | 0.0.9 | File uploads |
| boto3 | 1.34 | AWS S3 |
| web3 | 6.18 | Polygon blockchain writes |
| python-dotenv | 1.0 | .env loading |

### AI / ML
| Tool | Version | Purpose |
|------|---------|---------|
| LightGBM | 4.3 | Default probability classifier (lgbm_credit_model.pkl) |
| scikit-learn | 1.4 | Isolation Forest anomaly detector + scaler |
| Gradient Boosting Regressor | — | Safe loan amount prediction (gbr_loan_model.pkl) |
| pandas | 2.2 | CSV parsing + feature engineering |
| numpy | 1.26 | Numeric computation |
| beautifulsoup4 | 4.12 | CIBIL HTML parsing |
| joblib | 1.4 | Model loading from .pkl |

### Blockchain
| Tool | Version | Purpose |
|------|---------|---------|
| Solidity | 0.8.19 | Smart contract language |
| Hardhat | 2.22 | Contract compile + deploy |
| Polygon Mumbai | testnet | Blockchain network |
| Ethers.js | 6.12 | Frontend wallet |
| web3.py | 6.18 | Backend contract calls |

### Database
| Tool | Purpose |
|------|---------|
| PostgreSQL | Primary relational database |
| SQLAlchemy ORM | Model definitions + queries |

### Storage
| Tool | Purpose |
|------|---------|
| AWS S3 | Encrypted file storage for uploaded CSVs and CIBIL reports |

---

## Project Structure

```
microfinance-platform/
│
├── README.md                           ← You are here
├── setup.sh                            ← One-command setup script
├── run.sh                              ← Start backend + frontend together
│
├── backend/
│   ├── .env.example                    ← Copy to .env, fill in credentials
│   ├── requirements.txt                ← All Python dependencies
│   ├── ml_models/                      ← DROP YOUR 5 .pkl FILES HERE
│   │   ├── lgbm_credit_model.pkl
│   │   ├── isolation_forest_model.pkl
│   │   ├── isolation_forest_scaler.pkl
│   │   ├── gbr_loan_model.pkl
│   │   └── label_encoder_business.pkl
│   └── app/
│       ├── main.py                     ← FastAPI app + CORS + router registration
│       ├── database.py                 ← SQLAlchemy engine + session + get_db()
│       ├── models/
│       │   └── models.py               ← All 8 database table definitions
│       ├── routers/
│       │   ├── auth.py                 ← /api/auth/register, login, me
│       │   ├── applications.py         ← /api/applications/* (full workflow)
│       │   └── lenders.py              ← /api/lenders/* (CRUD + seed)
│       └── services/
│           ├── ai_service.py           ← CSV extraction, CIBIL parsing, score_vendor()
│           ├── emi_service.py          ← EMI = (P×r×(1+r)^n)/((1+r)^n-1)
│           ├── lender_service.py       ← Rule-based lender matching algorithm
│           ├── blockchain_service.py   ← Polygon contract write + hash
│           ├── s3_service.py           ← AWS S3 upload + presigned URL
│           └── auth_service.py         ← JWT create/verify + password hash
│
├── frontend/
│   ├── .env.example                    ← VITE_API_URL=http://localhost:8000/api
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                    ← ReactDOM.render + BrowserRouter + AppProvider
│       ├── App.jsx                     ← All routes + ProtectedRoute wrapper
│       ├── styles/
│       │   └── global.css              ← Dark theme CSS variables + utility classes
│       ├── api/
│       │   └── axios.js                ← Axios instance + JWT interceptor + 401 redirect
│       ├── context/
│       │   └── AppContext.jsx          ← Global state: user, aiResult, selections
│       ├── components/
│       │   └── Navbar.jsx              ← Top nav with role badge + logout
│       ├── services/
│       │   └── smsProcessor.js         ← On-device SMS feature extraction (privacy-first)
│       └── pages/
│           ├── Landing.jsx             ← Homepage with features + how it works
│           ├── Register.jsx            ← Account creation (applicant or lender role)
│           ├── Login.jsx               ← Email + password login
│           ├── ApplyForm.jsx           ← 2-step: business details + file upload
│           ├── EligibilityResult.jsx   ← AI scores, charts, ratio bars, CIBIL breakdown
│           ├── EMISelection.jsx        ← Loan slider + 5 EMI tenure options
│           ├── LenderSelection.jsx     ← Matched lenders with interest rates + match score
│           ├── MyApplications.jsx      ← Application list + status timeline
│           ├── LenderDashboard.jsx     ← Full analytics + approve/reject/modify panel
│           └── VendorDashboard.jsx     ← Simple 4-tab mobile UI for vendors
│
└── contracts/
    ├── package.json
    ├── hardhat.config.js               ← Polygon Mumbai + localhost network config
    ├── scripts/
    │   └── deploy.js                   ← Deploy LoanApplicationContract
    └── contracts/
        └── LoanApplicationContract.sol ← Stores app hashes + status updates on chain
```

---

## User Roles

There are three roles in the system. Role is set at registration and encoded in the JWT.

### Applicant (Business Owner)
- Can register, upload documents, run AI analysis
- Can select EMI plan and lender, submit application
- Can view their own applications only
- Can access Vendor Mobile Dashboard (`/vendor`)
- **Cannot** access other users' applications or lender dashboard

### Lender (Microfinance Institution)
- Can register as lender
- Can view all applications submitted to them via lender dashboard
- Can approve, reject, modify, or request documents
- Cannot view other lenders' applications

### Admin
- Has access to everything (lender + applicant routes)
- Required to create lender profiles and set lender rules via API
- Can seed demo lenders

---

## User Flow

The complete journey from zero to loan decision:

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICANT JOURNEY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. REGISTER                                                    │
│     /register → choose role: Applicant                         │
│     → JWT token stored in localStorage                         │
│                                                                 │
│  2. FILL BUSINESS DETAILS                                       │
│     /apply → Step 1                                             │
│     Enter: declared_monthly_income, years_in_business,         │
│             city_tier (1/2/3), business_type                   │
│                                                                 │
│  3. UPLOAD DOCUMENTS                                            │
│     /apply → Step 2                                             │
│     Upload: transactions.csv  +  CIBIL_Report.html             │
│     Click: "Analyze & Get Eligibility"                         │
│                                                                 │
│  4. AI ANALYSIS (automatic, ~2 seconds)                        │
│     Backend: extract_transactions() parses CSV                 │
│     Backend: extract_cibil() parses CIBIL HTML                 │
│     Backend: score_vendor() runs 3 ML models                   │
│     Result: trust_score, risk_category, safe_loan_amount       │
│                                                                 │
│  5. VIEW ELIGIBILITY RESULT                                     │
│     /eligibility                                                │
│     See: Trust Score gauge, KPI cards, cash flow charts,       │
│          ratio bars, open accounts, top spend recipients       │
│                                                                 │
│  6. CHOOSE EMI PLAN                                             │
│     /emi-selection                                              │
│     Slider: choose any amount ≤ safe_loan_amount               │
│     Pick: 6 / 12 / 18 / 24 / 36 month tenure                  │
│     See: EMI amount, total interest, total payable — live      │
│                                                                 │
│  7. SELECT LENDER                                               │
│     /lender-selection                                           │
│     See: AI-matched lenders with interest rates + match score  │
│     Pick: preferred lender                                      │
│     Click: Submit Application                                   │
│                                                                 │
│  8. BLOCKCHAIN WRITE (automatic)                               │
│     Application hash written to Polygon smart contract         │
│     tx_hash stored in DB + shown in dashboard                  │
│                                                                 │
│  9. TRACK APPLICATION                                           │
│     /my-applications                                            │
│     See: status timeline, lender note, modification details    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        LENDER JOURNEY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. REGISTER                                                    │
│     /register?role=lender → lender account created             │
│                                                                 │
│  2. REVIEW APPLICATIONS                                         │
│     /lender-dashboard                                           │
│     Left sidebar: list of all submitted applications            │
│     Each entry shows: risk badge, trust score, loan amount     │
│                                                                 │
│  3. ANALYZE APPLICANT                                           │
│     Click any application → full analytics panel               │
│     See: KPI cards, cash flow chart, ratio bars,               │
│          CIBIL breakdown, open accounts, blockchain trail      │
│                                                                 │
│  4. TAKE ACTION                                                 │
│     Action panel at bottom (only for "submitted" apps):        │
│     ✅ Approve   — loan approved as requested                   │
│     ❌ Reject    — loan rejected (note optional)               │
│     ✏️ Modify    — change loan amount or EMI                   │
│     📋 Request Docs — ask for additional documents             │
│                                                                 │
│  5. BLOCKCHAIN WRITE (automatic on action)                     │
│     Status update hashed and written to Polygon               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Underwriting Engine

**File:** `backend/app/services/ai_service.py`

The AI layer is a direct port of the Colab notebook ML pipeline into a production FastAPI service. It uses three separate models that work together:

### Model 1 — LightGBM Credit Classifier (`lgbm_credit_model.pkl`)
Predicts the probability that a borrower will default on the loan.

**Input features (20 columns):**
```
avg_monthly_credit        avg_monthly_debit
std_monthly_credit        credit_debit_ratio
avg_txn_frequency_per_month  max_single_debit
income_consistency_score  cibil_score
has_existing_loan         existing_loan_amount
existing_emi              emi_to_income_ratio
on_time_payment_pct       hard_inquiries_12m
credit_age_months         years_in_business
city_tier                 declared_monthly_income
business_type_enc         (label encoded)
```

**Output:**
- `default_probability` — float 0.0 to 1.0
- `trust_score` — mapped to 100–1000 scale: `(1 - default_prob) × 900 + 100`
- `risk_category` — LOW RISK (≥750) / MEDIUM RISK (≥600) / HIGH RISK (<600)

### Model 2 — Isolation Forest Anomaly Detector (`isolation_forest_model.pkl` + `isolation_forest_scaler.pkl`)
Detects unusual transaction patterns that suggest fraud, account manipulation, or inflated income claims.

**Input features (9 columns):**
```
avg_monthly_credit    avg_monthly_debit    credit_debit_ratio
std_monthly_credit    avg_txn_frequency_per_month
max_single_debit      income_consistency_score
income_txn_ratio      city_tier
```

**Output:**
- `anomaly_risk_pct` — 0–100 risk score
- `anomaly_flagged` — boolean, triggers warning banner in UI

### Model 3 — Gradient Boosting Regressor (`gbr_loan_model.pkl`)
Predicts the maximum safe loan amount the applicant can repay.

**Input features (10 columns):**
```
avg_monthly_credit    avg_monthly_debit    credit_debit_ratio
income_consistency_score  cibil_score      emi_to_income_ratio
on_time_payment_pct   years_in_business    city_tier
declared_monthly_income
```

**Output:**
- `safe_loan_amount` — rounded to nearest ₹1,000

### Derived Financial Ratios (computed before model inference)
```python
credit_debit_ratio       = avg_monthly_credit / avg_monthly_debit
emi_to_income_ratio      = existing_emi / declared_monthly_income
income_consistency_score = 1 - (std_monthly_credit / avg_monthly_credit)
income_txn_ratio         = avg_monthly_credit / declared_monthly_income
```

### CSV Parsing (`extract_transactions`)
Reads `transactions.csv` with columns: `date`, `type`, `amount`, `recipient`

- Classifies rows as CREDITED or DEBITED
- Groups by calendar month
- Computes monthly credit/debit sums, standard deviation, frequency
- Returns top 6 recipients by spend for dashboard chart
- Returns monthly chart data for cash flow visualization

### CIBIL HTML Parsing (`extract_cibil`)
Reads raw CIBIL report HTML using BeautifulSoup

Extracts:
- CIBIL score (3-digit number between 300–900)
- Personal info: name, DOB, PAN
- All loan accounts: bank, type, outstanding balance, EMI, interest rate, open/closed status
- Payment history: on-time vs late payment counts → `on_time_payment_pct`
- Hard enquiries in last 12 months
- Credit age in months from oldest account open date

### AI Loan Tiers
After scoring, three loan options are auto-generated:

| Tier | Amount | Rate (city-adjusted) |
|------|--------|---------------------|
| Conservative | 60% of safe_loan_amount | Tier 1: 14% / Tier 2: 16% / Tier 3: 18% |
| Recommended | 100% of safe_loan_amount | Same |
| Maximum | 130% of safe_loan_amount | Same |

---

## SMS Privacy Design

**File:** `frontend/src/services/smsProcessor.js`

SMS-based bank data is used to extract income and expense features for vendors who don't have formal transaction CSVs. The strict rule: **raw SMS never leaves the device.**

### Processing Pipeline (runs 100% on-device in JavaScript)

```
Raw SMS Array (on device only)
         │
         ▼
  ┌─────────────────────────────────────┐
  │  FILTER 1: OTP / Sensitive Guard   │
  │  Pattern match for:                │
  │  "OTP", "one-time password",       │
  │  "verification code", "do not      │
  │  share", "password"                │
  │  → Hard exclude, no processing     │
  └────────────────┬────────────────────┘
                   │ Safe messages only
                   ▼
  ┌─────────────────────────────────────┐
  │  FILTER 2: Financial SMS Only      │
  │  Must contain credit/debit regex   │
  │  + currency symbols (₹, Rs, INR)   │
  │  → Personal messages dropped       │
  └────────────────┬────────────────────┘
                   │ Bank SMS only
                   ▼
  ┌─────────────────────────────────────┐
  │  EXTRACT: Amount (float) only      │
  │  Regex pulls numeric amount        │
  │  NO merchant names stored          │
  │  NO account numbers stored         │
  │  NO message text kept              │
  └────────────────┬────────────────────┘
                   │ Numbers only
                   ▼
  ┌─────────────────────────────────────┐
  │  AGGREGATE: Monthly buckets        │
  │  Group by YYYY-MM                  │
  │  Sum credits per month             │
  │  Sum debits per month              │
  │  One entry per month only          │
  └────────────────┬────────────────────┘
                   │ Monthly totals
                   ▼
  ┌─────────────────────────────────────┐
  │  SERIALIZE: Strip all strings      │
  │  Allow only numeric fields         │
  │  Add privacy attestation object    │
  └────────────────┬────────────────────┘
                   │
                   ▼
         POST to /api/applications/analyze
         (6 numbers + monthly chart)
```

### What IS transmitted to server
```json
{
  "avg_monthly_credit": 42000,
  "std_monthly_credit": 5200,
  "avg_monthly_debit": 31000,
  "avg_txn_frequency_per_month": 28,
  "max_single_debit": 18000,
  "detected_emi_amount": 4500,
  "monthly_summary": [
    { "month": "2024-01", "credit": 41000, "debit": 30000 }
  ],
  "privacy": {
    "raw_sms_transmitted": false,
    "otp_messages_filtered": true,
    "processing_location": "on_device",
    "features_only": true
  }
}
```

### What is NEVER transmitted
- Any message body text
- Sender names or bank names from SMS
- Account numbers, card numbers, IFSC codes
- OTP or verification messages (hard filtered)
- Individual transaction timestamps
- Merchant or recipient identifiers

### Security Guarantees
1. **Hard OTP filter** — `isSensitiveMessage()` runs before any processing
2. **Amount-only extraction** — only `parseFloat()` of regex match groups, never message strings
3. **Monthly aggregation** — individual transactions never leave device
4. **Serialization whitelist** — `serializeForTransmission()` only allows known numeric keys
5. **Privacy attestation** — payload includes a signed proof object confirming on-device processing

---

## EMI Calculation Engine

**File:** `backend/app/services/emi_service.py`

### Formula
```
EMI = (P × r × (1 + r)^n) / ((1 + r)^n − 1)

where:
  P = Principal (loan amount)
  r = Monthly interest rate = annual_rate / 100 / 12
  n = Tenure in months
```

### City-Tier Interest Rate Adjustment
Different city tiers get different base rates from the lender's rule configuration:

```
Tier 1 (Metro)      → tier1_rate  (typically 14%)
Tier 2 (Mid city)   → tier2_rate  (typically 16%)
Tier 3 (Small town) → tier3_rate  (typically 18%)
```

### EMI Options Generated
For each application, 5 tenure options are generated: 6, 12, 18, 24, 36 months.
Each option shows:
- Monthly EMI amount
- Total amount payable
- Total interest paid
- Annual interest rate

### Dynamic Recalculation on Frontend
On the `/emi-selection` page, the EMI slider lets users change the loan amount between ₹5,000 and the AI maximum. All 5 EMI options recalculate live in the browser using the same formula implemented in JavaScript — no API call needed for recalculation.

---

## Lender Matching Engine

**File:** `backend/app/services/lender_service.py`

When the AI analysis completes, the platform instantly runs lender matching against all active lenders in the database.

### Matching Rules (all must pass)

```
1. City Tier      → lender.rules.city_tier must be NULL (all tiers) 
                    or exactly match applicant's city_tier

2. Business Type  → lender.rules.business_types must be NULL (all types)
                    or contain applicant's business_type

3. CIBIL Score    → applicant.cibil_score >= lender.rules.min_cibil

4. Risk Score     → (default_probability × 100) <= lender.rules.max_risk_score

5. Loan Range     → lender.min_loan <= requested_amount <= lender.max_loan
```

### Match Score Algorithm
Each matched lender gets a score 0–100 used to rank them:
```
match_score = (cibil_score / 900) × 40
            + (1 - default_probability) × 40
            + 20  (if city tier matches exactly, not wildcard)
```

### Demo Lenders (seeded by /api/lenders/seed)

| Name | Accepts | CIBIL Min | Max Risk | Rate (T1/T2/T3) |
|------|---------|-----------|----------|-----------------|
| MudraMFI | Kirana, Retail, Food | 580 | 45% | 13.5 / 15 / 17% |
| FinGrow Capital | All types | 650 | 30% | 12 / 15.5 / 18.5% |
| Grameen Saathi | All types, Tier 3 only | 520 | 50% | 16 / 17 / 16.5% |
| SwiftLoan MFI | All types | 600 | 40% | 14.5 / 16.5 / 18% |

---

## Blockchain Audit Layer

**File:** `backend/app/services/blockchain_service.py`
**Contract:** `contracts/contracts/LoanApplicationContract.sol`

### What Gets Written to Chain

| Event | Trigger | Data stored |
|-------|---------|-------------|
| Application Submitted | User clicks Submit | SHA-256 hash of application data |
| Approved | Lender clicks Approve | Status update: "approved" |
| Rejected | Lender clicks Reject | Status update: "rejected" |
| Modified | Lender modifies offer | Status update: "modified" |
| Docs Requested | Lender requests docs | Status update: "docs_requested" |

### Smart Contract: `LoanApplicationContract.sol`

```solidity
struct Application {
    bytes32 dataHash;     // SHA-256 of application JSON
    uint256 submittedAt;  // Unix timestamp
    address submittedBy;  // Wallet that submitted
    string  status;       // Current status string
    uint256 updatedAt;    // Last status change timestamp
}

mapping(uint256 => Application) public applications;

function submitApplication(uint256 appId, bytes32 dataHash) external
function updateStatus(uint256 appId, string calldata newStatus) external
function getApplication(uint256 appId) external view returns (...)
```

### Hash Generation
The application data hash is computed on the backend before writing:
```python
data = {
    "application_id": app.id,
    "user_id": user.id,
    "lender_id": lender_id,
    "loan_amount": amount,
    "trust_score": report.trust_score,
    "risk_category": report.risk_category,
}
hash = "0x" + sha256(json.dumps(data, sort_keys=True)).hexdigest()
```

### Graceful Fallback
If `CONTRACT_ADDRESS` is not set or starts with `0x000`, blockchain writes are skipped silently. The platform works normally. The `blockchain_txns` table just stays empty.

---

## Vendor Mobile Dashboard

**File:** `frontend/src/pages/VendorDashboard.jsx`
**URL:** `/vendor`

Designed for non-technical small business owners. Max width 420px, large touch targets, no financial jargon.

### 4-Tab Bottom Navigation

#### 🏠 Home Tab
- **Eligibility Card** — shows current status in plain language ("Loan Approved!", "Sent to bank", "Being checked") with color coding
- **Active Loan Card** — if approved, shows Loan Amount / Monthly EMI / Months in large clear numbers
- **Quick Action Buttons** — Check Eligibility, View Analysis, My Applications, New Application

#### 💰 My Loan Tab
- List of all applications with plain-language status
- 3-step visual progress bar (Submitted → Reviewing → Decision)
- If approved: EMI repayment schedule card showing monthly payment and total months
- Lender notes displayed if any

#### 🔒 Privacy Tab
- Step-by-step explanation of exactly what happens to their SMS data (5 steps with icons)
- SMS permission toggle control — Allow / Remove access
- Plain-language privacy statement: "Your messages stay on your phone. Only income totals are shared."

#### ❓ Help Tab
- 7 plain-language FAQs with expandable answers
- Topics: how to apply, what documents, is it safe, how long approval takes, what if rejected, how to repay, can I apply for less
- WhatsApp support button at bottom

---

## Frontend Pages

| Route | Page | Who can access | Purpose |
|-------|------|---------------|---------|
| `/` | `Landing.jsx` | Everyone | Homepage, features, how it works |
| `/register` | `Register.jsx` | Public | Create account (applicant or lender) |
| `/login` | `Login.jsx` | Public | Sign in |
| `/apply` | `ApplyForm.jsx` | Applicant | 2-step: business details + file upload |
| `/eligibility` | `EligibilityResult.jsx` | Applicant | AI scores, charts, CIBIL breakdown |
| `/emi-selection` | `EMISelection.jsx` | Applicant | Loan slider + EMI plan picker |
| `/lender-selection` | `LenderSelection.jsx` | Applicant | Matched lenders + submit |
| `/my-applications` | `MyApplications.jsx` | Applicant | Application tracking + timeline |
| `/vendor` | `VendorDashboard.jsx` | Applicant | Simple mobile dashboard |
| `/lender-dashboard` | `LenderDashboard.jsx` | Lender | Full analytics + action panel |

### Protected Routes
All routes except `/`, `/register`, `/login` require a valid JWT. The `ProtectedRoute` wrapper in `App.jsx` redirects unauthenticated users to `/login`. Lender dashboard additionally requires `role === 'lender'`.

### Global State (AppContext)
State shared across the application flow:
```javascript
user              // logged-in user object
aiResult          // AI scores from /analyze response
txnData           // transaction summary for charts
cibilData         // CIBIL parsed data
emiOptions        // generated EMI options array
matchedLenders    // lenders matched to this applicant
applicationId     // DB ID of current application
selectedLender    // lender chosen on /lender-selection
selectedEMI       // EMI plan chosen on /emi-selection
```

---

## Backend API Reference

Base URL: `http://localhost:8000/api`
Interactive docs: `http://localhost:8000/docs`

### Auth Endpoints

| Method | URL | Body | Auth | Description |
|--------|-----|------|------|-------------|
| POST | `/auth/register` | `{email, full_name, password, role}` | No | Create account |
| POST | `/auth/login` | `form: {username, password}` | No | Get JWT token |
| GET | `/auth/me` | — | JWT | Get current user |

### Application Endpoints

| Method | URL | Body/Params | Auth | Description |
|--------|-----|-------------|------|-------------|
| POST | `/applications/analyze` | multipart: csv_file, cibil_file, 4 form fields | JWT | Upload files → run AI → returns full analysis |
| POST | `/applications/submit` | `{application_id, lender_id, loan_amount, emi_months, emi_amount, interest_rate}` | JWT | Submit to lender |
| GET | `/applications/my` | — | JWT | Get all user's applications |
| GET | `/applications/{id}` | — | JWT | Get single application (full detail) |
| POST | `/applications/{id}/lender-action` | `{action, note?, modified_loan_amount?, modified_emi?}` | JWT (lender) | Approve/reject/modify/request_docs |
| GET | `/applications/lender/dashboard` | — | JWT (lender) | All applications for lender dashboard |

### Lender Endpoints

| Method | URL | Body | Auth | Description |
|--------|-----|------|------|-------------|
| GET | `/lenders/` | — | No | List all active lenders |
| POST | `/lenders/` | `{name, description, min_loan, max_loan}` | JWT (admin) | Create lender |
| POST | `/lenders/{id}/rules` | rule fields | JWT (admin) | Set lender matching rules |
| POST | `/lenders/seed` | — | No | Seed 4 demo lenders (run once) |

### Key Request/Response Examples

**POST /api/applications/analyze**
```bash
curl -X POST http://localhost:8000/api/applications/analyze \
  -H "Authorization: Bearer {JWT}" \
  -F "csv_file=@transactions.csv" \
  -F "cibil_file=@CIBIL_Report.html" \
  -F "declared_monthly_income=45000" \
  -F "years_in_business=2.5" \
  -F "city_tier=3" \
  -F "business_type=Kirana/Grocery"
```

Response:
```json
{
  "application_id": 12,
  "ai_result": {
    "trust_score": 742,
    "default_probability": 0.1756,
    "risk_category": "MEDIUM RISK",
    "safe_loan_amount": 95000,
    "anomaly_risk_pct": 18.4,
    "anomaly_flagged": false,
    "income_consistency": 0.821,
    "credit_debit_ratio": 1.34,
    "emi_to_income_ratio": 0.12
  },
  "txn_data": { ... },
  "cibil_data": { ... },
  "emi_options": [ ... ],
  "matched_lenders": [ ... ]
}
```

---

## Database Schema

### `users`
```
id            serial PRIMARY KEY
email         varchar UNIQUE NOT NULL
full_name     varchar NOT NULL
hashed_password varchar NOT NULL
role          varchar DEFAULT 'applicant'   -- applicant | lender | admin
is_active     boolean DEFAULT true
created_at    timestamptz
```

### `lenders`
```
id            serial PRIMARY KEY
name          varchar NOT NULL
logo_url      varchar
description   text
min_loan      float DEFAULT 10000
max_loan      float DEFAULT 500000
user_id       int FK→users
is_active     boolean DEFAULT true
created_at    timestamptz
```

### `lender_rules`
```
id                  serial PRIMARY KEY
lender_id           int FK→lenders
city_tier           int NULL            -- NULL = accepts all tiers
business_types      json NULL           -- NULL = accepts all types
min_cibil           int DEFAULT 600
max_risk_score      float DEFAULT 40    -- max default_probability %
base_interest_rate  float DEFAULT 16
tier1_rate          float DEFAULT 14
tier2_rate          float DEFAULT 16
tier3_rate          float DEFAULT 18
max_emi_to_income   float DEFAULT 0.5
```

### `applications`
```
id                      serial PRIMARY KEY
user_id                 int FK→users
lender_id               int FK→lenders (nullable until selected)
declared_monthly_income float
years_in_business       float
city_tier               int
business_type           varchar
requested_loan_amount   float (nullable until user selects)
selected_emi_months     int
selected_emi_amount     float
selected_interest_rate  float
status                  varchar DEFAULT 'pending'
  -- pending | ai_analyzed | submitted | approved | rejected | modified | docs_requested
lender_note             text
modified_loan_amount    float
modified_emi            float
blockchain_tx_hash      varchar
created_at              timestamptz
updated_at              timestamptz
```

### `ai_reports`
```
id                  serial PRIMARY KEY
application_id      int FK→applications UNIQUE
trust_score         int
default_probability float
risk_category       varchar
safe_loan_amount    float
anomaly_risk_pct    float
anomaly_flagged     boolean
income_consistency  float
credit_debit_ratio  float
emi_to_income_ratio float
txn_data            json        -- full transaction summary for charts
cibil_data          json        -- full CIBIL parsed data
full_result         json        -- entire analysis dict
created_at          timestamptz
```

### `uploaded_files`
```
id              serial PRIMARY KEY
application_id  int FK→applications
file_type       varchar    -- transactions_csv | cibil_html
s3_key          varchar
original_filename varchar
uploaded_at     timestamptz
```

### `emi_options`
```
id              serial PRIMARY KEY
application_id  int FK→applications
lender_id       int FK→lenders (nullable)
loan_amount     float
tenure_months   int
interest_rate   float
monthly_emi     float
total_payable   float
total_interest  float
```

### `blockchain_transactions`
```
id              serial PRIMARY KEY
application_id  int FK→applications
tx_hash         varchar UNIQUE
action          varchar    -- submitted | approved | rejected | modified
data_hash       varchar    -- SHA-256 of application data
block_number    int
network         varchar DEFAULT 'polygon_mumbai'
created_at      timestamptz
```

---

## Setup & Run

### Prerequisites
```bash
node --version    # Need 18+
python3 --version # Need 3.10+
psql --version    # Need PostgreSQL running locally
```

### Step 1 — Create database
```bash
psql -U postgres -c "CREATE DATABASE microfinance;"
```

### Step 2 — Backend setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env → set DATABASE_URL with your postgres password
```

### Step 3 — Place ML model files
```bash
# Copy all 5 pkl files into backend/ml_models/
backend/ml_models/lgbm_credit_model.pkl
backend/ml_models/isolation_forest_model.pkl
backend/ml_models/isolation_forest_scaler.pkl
backend/ml_models/gbr_loan_model.pkl
backend/ml_models/label_encoder_business.pkl
```

### Step 4 — Start backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
# Tables auto-created on first run
# Swagger UI: http://localhost:8000/docs
```

### Step 5 — Seed demo lenders (once only)
```bash
curl -X POST http://localhost:8000/api/lenders/seed
# Response: {"message": "Seeded 4 lenders"}
```

### Step 6 — Frontend setup
```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:8000/api
npm run dev
# Frontend: http://localhost:5173
```

### Step 7 (Optional) — Smart contracts
```bash
cd contracts
npm install
npx hardhat compile

# Local test (no crypto needed):
npx hardhat node                                                    # Terminal A
npx hardhat run scripts/deploy.js --network localhost              # Terminal B
# Copy printed address → backend/.env CONTRACT_ADDRESS=0x...

# Polygon Mumbai testnet:
# 1. Add WALLET_PRIVATE_KEY to backend/.env
# 2. Get test MATIC from faucet.polygon.technology
npx hardhat run scripts/deploy.js --network mumbai
```

### Quick Start (after initial setup)
```bash
bash run.sh
# Starts both backend :8000 and frontend :5173
```

---

## Environment Variables

### `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `JWT_SECRET` | ✅ Yes | Long random string for JWT signing |
| `JWT_ALGORITHM` | No | Default: HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Default: 60 |
| `AWS_ACCESS_KEY_ID` | Optional | S3 file uploads |
| `AWS_SECRET_ACCESS_KEY` | Optional | S3 file uploads |
| `AWS_BUCKET_NAME` | Optional | S3 bucket name |
| `AWS_REGION` | Optional | Default: ap-south-1 |
| `CONTRACT_ADDRESS` | Optional | Deployed Polygon contract address |
| `POLYGON_RPC_URL` | Optional | RPC endpoint for Polygon |
| `WALLET_PRIVATE_KEY` | Optional | Wallet for signing blockchain txns |
| `FRONTEND_URL` | No | Default: http://localhost:5173 |

### `frontend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ Yes | Backend URL, e.g. http://localhost:8000/api |
| `VITE_CONTRACT_ADDRESS` | Optional | For frontend blockchain reads |

---

## Business Rules

These rules are enforced in the backend — they cannot be bypassed from the frontend:

1. **Loan cap** — User cannot request more than `ai_report.safe_loan_amount`. The `/applications/submit` endpoint returns HTTP 400 if `requested_loan_amount > safe_loan_amount`.

2. **Lender matching** — Application is only submitted to a lender that passed all matching rules for that applicant. Frontend only shows matched lenders.

3. **EMI dynamism** — EMI recalculates based on: selected loan amount × lender's city-tier interest rate × selected tenure. Different lenders have different rates per city tier.

4. **Status machine** — Application status follows a one-way flow. Lender can only act on applications in `submitted` status.

5. **Role enforcement** — JWT contains role. Lender dashboard endpoint verifies `role == 'lender'`. Applicants cannot take lender actions.

6. **File validation** — `/analyze` requires both `csv_file` and `cibil_file` as multipart uploads. Missing either returns HTTP 422.

7. **SMS privacy** — `smsProcessor.js` enforces OTP filtering and numeric-only serialization client-side. Server receives only aggregated numbers.

---

## Deployment

| Layer | Recommended Platform | Notes |
|-------|---------------------|-------|
| Frontend | Vercel | `cd frontend && npx vercel --prod` |
| Backend | Render (free tier) or AWS EC2 | Set all env vars in dashboard |
| Database | Neon.tech or Supabase | Free PostgreSQL, copy connection string to DATABASE_URL |
| File Storage | AWS S3 | Create bucket in ap-south-1, enable server-side encryption |
| Blockchain | Polygon Mumbai (testnet) or Mainnet | Deploy contract, set CONTRACT_ADDRESS |

### Vercel Frontend Deploy
```bash
cd frontend
npm run build
npx vercel --prod
# Set VITE_API_URL=https://your-backend.render.com/api in Vercel dashboard
```

### Render Backend Deploy
1. Create new Web Service on render.com
2. Connect GitHub repo
3. Build command: `pip install -r backend/requirements.txt`
4. Start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all env vars from `.env.example`

---

## Supported Business Types

```
Kirana/Grocery        Retail              Food & Beverage
Textile/Clothing      Electronics         Pharmacy
Agriculture           Manufacturing       Service/Repair
Transportation        Construction        Education
Other
```

---

*Built with FastAPI · React · LightGBM · Polygon · PostgreSQL · AWS S3*