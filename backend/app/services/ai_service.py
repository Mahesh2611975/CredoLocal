"""
AI Underwriting Service
Wraps the ML inference logic from the Colab notebook.
Place your 5 .pkl files in backend/ml_models/
"""

import os
import re
import json
import warnings
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
from dateutil.relativedelta import relativedelta
from bs4 import BeautifulSoup

warnings.filterwarnings("ignore")

# ── Model paths ────────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "../../ml_models")

_lgbm_model = None
_iso_model = None
_scaler_iso = None
_gbr_model = None
_le_biz = None


def _load_models():
    global _lgbm_model, _iso_model, _scaler_iso, _gbr_model, _le_biz
    if _lgbm_model is None:
        _lgbm_model = joblib.load(os.path.join(MODEL_DIR, "lgbm_credit_model.pkl"))
        _iso_model  = joblib.load(os.path.join(MODEL_DIR, "isolation_forest_model.pkl"))
        _scaler_iso = joblib.load(os.path.join(MODEL_DIR, "isolation_forest_scaler.pkl"))
        _gbr_model  = joblib.load(os.path.join(MODEL_DIR, "gbr_loan_model.pkl"))
        _le_biz     = joblib.load(os.path.join(MODEL_DIR, "label_encoder_business.pkl"))


# ── CSV Extraction ─────────────────────────────────────────────────────
def extract_transactions(file_bytes: bytes) -> dict:
    import io
    df = pd.read_csv(io.BytesIO(file_bytes))
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)
    df["date"]   = pd.to_datetime(df["date"], errors="coerce", format="mixed")

    t       = df["type"].str.upper().fillna("")
    credits = df[t == "CREDITED"].copy()
    debits  = df[t.isin(["DEBIT", "DEBITED"])].copy()

    credits["month"] = credits["date"].dt.to_period("M")
    debits["month"]  = debits["date"].dt.to_period("M")

    mc = credits.groupby("month")["amount"].sum()
    md = debits.groupby("month")["amount"].sum()
    all_months = md.index.union(mc.index)
    mc = mc.reindex(all_months, fill_value=0)
    md = md.reindex(all_months, fill_value=0)
    n  = max(len(all_months), 1)

    avg_c = float(mc.mean())
    std_c = float(mc.std()) if n > 1 else 0.0
    avg_d = float(md.mean())

    monthly_chart = {
        str(m): {"credit": float(mc[m]), "debit": float(md[m])}
        for m in all_months
    }

    top_recipients = {}
    if "recipient" in debits.columns:
        top_recipients = (
            debits.groupby("recipient")["amount"].sum()
            .sort_values(ascending=False).head(6)
            .to_dict()
        )

    return {
        "avg_monthly_credit":           round(avg_c, 2),
        "std_monthly_credit":           round(std_c, 2),
        "avg_monthly_debit":            round(avg_d, 2),
        "avg_txn_frequency_per_month":  round(len(df) / n, 2),
        "max_single_debit":             round(float(debits["amount"].max()) if len(debits) else 0, 2),
        "total_credits":                round(float(credits["amount"].sum()), 2),
        "total_debits":                 round(float(debits["amount"].sum()), 2),
        "n_months":                     n,
        "monthly_chart":                monthly_chart,
        "top_recipients":               top_recipients,
        "n_transactions":               len(df),
    }


# ── CIBIL HTML Extraction ──────────────────────────────────────────────
def extract_cibil(file_bytes: bytes, report_date: datetime = None) -> dict:
    if report_date is None:
        report_date = datetime.now()

    html = file_bytes.decode("utf-8", errors="ignore")
    lines = [
        l.strip()
        for l in BeautifulSoup(html, "html.parser")
                  .get_text(separator="\n", strip=True).split("\n")
        if l.strip()
    ]

    def parse_inr(s):
        try:    return float(re.sub(r"[₹,\s]", "", s))
        except: return 0.0

    cibil_score = next(
        (int(l) for l in lines if re.fullmatch(r"\d{3}", l) and 300 <= int(l) <= 900), 0
    )

    name = dob = pan = ""
    for i, l in enumerate(lines):
        if l == "Name" and i + 1 < len(lines):             name = lines[i + 1]
        if l == "Date of Birth" and i + 1 < len(lines):    dob  = lines[i + 1]
        if "Income Tax ID" in l and i + 2 < len(lines):    pan  = lines[i + 2]

    accounts, cur = [], {}
    for i, l in enumerate(lines):
        nxt = lines[i + 1] if i + 1 < len(lines) else ""

        if l in ("Member Name",) and i + 1 < len(lines):
            if cur: accounts.append(cur)
            cur = {"bank": nxt}

        if "Account Type"      in l and i + 1 < len(lines): cur["type"]       = nxt
        if "Sanctioned Amount" in l and i + 1 < len(lines): cur["sanctioned"] = parse_inr(nxt)
        if "Current Balance"   in l and i + 1 < len(lines): cur["balance"]    = parse_inr(nxt)
        if re.match(r"^EMI Amount$", l) and i + 1 < len(lines): cur["emi"]    = parse_inr(nxt)
        if "Rate of Interest"  in l and i + 1 < len(lines): cur["rate"]       = nxt
        if "Repayment Tenure"  in l and i + 1 < len(lines): cur["tenure"]     = nxt
        if "Date Opened"       in l and i + 1 < len(lines):
            try:    cur["opened"] = datetime.strptime(nxt.strip(), "%d/%m/%Y").isoformat()
            except: pass
        if "Date Closed"       in l and i + 1 < len(lines):
            cur["closed"] = nxt.strip() not in ("-", "")

        if re.fullmatch(r"0", l):         cur["on_time"] = cur.get("on_time", 0) + 1
        if re.fullmatch(r"[1-9]\d*", l):  cur["late"]    = cur.get("late", 0) + 1

    if cur: accounts.append(cur)

    open_accs = [a for a in accounts if not a.get("closed", False) and a.get("balance", 0) > 0]

    existing_loan_amount = existing_emi = 0.0
    oldest_opened = None
    on_time = late = 0

    for a in open_accs:
        if a.get("balance", 0) > existing_loan_amount:
            existing_loan_amount = a["balance"]
            existing_emi         = a.get("emi", 0)
        opened_str = a.get("opened")
        if opened_str:
            try:
                opened = datetime.fromisoformat(opened_str)
                if oldest_opened is None or opened < oldest_opened:
                    oldest_opened = opened
            except: pass
        on_time += a.get("on_time", 0)
        late    += a.get("late", 0)

    credit_age_months = 0
    if oldest_opened:
        d = relativedelta(report_date, oldest_opened)
        credit_age_months = d.years * 12 + d.months

    on_time_pct = round(on_time / (on_time + late), 4) if (on_time + late) else 1.0

    cutoff = report_date - relativedelta(months=12)
    inquiries = []
    hard_inq_12m = 0
    for i, l in enumerate(lines):
        if "Date of Enquiry" in l and i + 3 < len(lines):
            try:
                d   = datetime.strptime(lines[i + 1].strip(), "%d/%m/%Y")
                pur = lines[i + 3] if "Enquiry Purpose" in lines[i + 2] else ""
                inquiries.append({
                    "date": lines[i + 1].strip(),
                    "purpose": pur,
                    "bank": lines[i - 2] if i >= 2 else ""
                })
                if d >= cutoff: hard_inq_12m += 1
            except: pass

    return {
        "cibil_score":          cibil_score,
        "has_existing_loan":    1 if open_accs else 0,
        "existing_loan_amount": round(existing_loan_amount, 2),
        "existing_emi":         round(existing_emi, 2),
        "hard_inquiries_12m":   hard_inq_12m,
        "credit_age_months":    credit_age_months,
        "on_time_payment_pct":  on_time_pct,
        "name":                 name,
        "dob":                  dob,
        "pan":                  pan,
        "open_accounts":        open_accs,
        "all_accounts":         accounts,
        "inquiries":            inquiries,
        "total_inquiries":      len(inquiries),
    }


# ── Core scoring function (from notebook) ─────────────────────────────
def score_vendor(
    avg_monthly_credit, avg_monthly_debit, std_monthly_credit,
    avg_txn_frequency_per_month, max_single_debit,
    cibil_score, on_time_payment_pct, existing_emi,
    declared_monthly_income, hard_inquiries_12m=0,
    credit_age_months=6, has_existing_loan=0,
    existing_loan_amount=0, years_in_business=1.0,
    city_tier=2, business_type="Kirana/Grocery"
) -> dict:
    _load_models()

    credit_debit_ratio       = avg_monthly_credit / max(avg_monthly_debit, 1)
    emi_to_income_ratio      = existing_emi / max(declared_monthly_income, 1)
    income_consistency_score = max(0.0, 1.0 - (std_monthly_credit / max(avg_monthly_credit, 1)))
    income_txn_ratio         = avg_monthly_credit / max(declared_monthly_income, 1)
    biz_enc = _le_biz.transform([business_type])[0] if business_type in _le_biz.classes_ else 0

    lgbm_row = pd.DataFrame([{
        "avg_monthly_credit":           avg_monthly_credit,
        "std_monthly_credit":           std_monthly_credit,
        "avg_monthly_debit":            avg_monthly_debit,
        "credit_debit_ratio":           credit_debit_ratio,
        "avg_txn_frequency_per_month":  avg_txn_frequency_per_month,
        "max_single_debit":             max_single_debit,
        "income_consistency_score":     income_consistency_score,
        "cibil_score":                  cibil_score,
        "has_existing_loan":            has_existing_loan,
        "existing_loan_amount":         existing_loan_amount,
        "existing_emi":                 existing_emi,
        "emi_to_income_ratio":          emi_to_income_ratio,
        "on_time_payment_pct":          on_time_payment_pct,
        "hard_inquiries_12m":           hard_inquiries_12m,
        "credit_age_months":            credit_age_months,
        "years_in_business":            years_in_business,
        "city_tier":                    city_tier,
        "declared_monthly_income":      declared_monthly_income,
        "business_type_enc":            biz_enc,
    }])
    default_prob = _lgbm_model.predict_proba(lgbm_row)[0][1]
    trust_score  = int(max(100, min(1000, round((1 - default_prob) * 900 + 100))))

    iso_row = pd.DataFrame([{
        "avg_monthly_credit":           avg_monthly_credit,
        "avg_monthly_debit":            avg_monthly_debit,
        "credit_debit_ratio":           credit_debit_ratio,
        "std_monthly_credit":           std_monthly_credit,
        "avg_txn_frequency_per_month":  avg_txn_frequency_per_month,
        "max_single_debit":             max_single_debit,
        "income_consistency_score":     income_consistency_score,
        "income_txn_ratio":             income_txn_ratio,
        "city_tier":                    city_tier,
    }])
    iso_scaled       = _scaler_iso.transform(iso_row)
    anomaly_raw      = _iso_model.decision_function(iso_scaled)[0]
    anomaly_risk_pct = round(max(0.0, min(100.0, (-anomaly_raw + 0.5) * 100)), 1)
    is_flagged       = bool(_iso_model.predict(iso_scaled)[0] == -1)

    gbr_row = pd.DataFrame([{
        "avg_monthly_credit":       avg_monthly_credit,
        "avg_monthly_debit":        avg_monthly_debit,
        "credit_debit_ratio":       credit_debit_ratio,
        "income_consistency_score": income_consistency_score,
        "cibil_score":              cibil_score,
        "emi_to_income_ratio":      emi_to_income_ratio,
        "on_time_payment_pct":      on_time_payment_pct,
        "years_in_business":        years_in_business,
        "city_tier":                city_tier,
        "declared_monthly_income":  declared_monthly_income,
    }])
    safe_loan = max(0, round(float(_gbr_model.predict(gbr_row)[0]), -3))

    risk_cat = (
        "LOW RISK"    if trust_score >= 750 else
        "MEDIUM RISK" if trust_score >= 600 else
        "HIGH RISK"
    )

    return {
        "trust_score":         trust_score,
        "default_probability": round(default_prob, 4),
        "risk_category":       risk_cat,
        "safe_loan_amount":    safe_loan,
        "anomaly_risk_pct":    anomaly_risk_pct,
        "anomaly_flagged":     is_flagged,
        "income_consistency":  round(income_consistency_score, 3),
        "credit_debit_ratio":  round(credit_debit_ratio, 3),
        "emi_to_income_ratio": round(emi_to_income_ratio, 3),
    }


# ── Full analysis pipeline ─────────────────────────────────────────────
def run_full_analysis(
    csv_bytes: bytes,
    cibil_bytes: bytes,
    declared_monthly_income: float,
    years_in_business: float,
    city_tier: int,
    business_type: str
) -> dict:
    txn   = extract_transactions(csv_bytes)
    cibil = extract_cibil(cibil_bytes, datetime.now())

    result = score_vendor(
        avg_monthly_credit          = txn["avg_monthly_credit"],
        std_monthly_credit          = txn["std_monthly_credit"],
        avg_monthly_debit           = txn["avg_monthly_debit"],
        avg_txn_frequency_per_month = txn["avg_txn_frequency_per_month"],
        max_single_debit            = txn["max_single_debit"],
        cibil_score                 = cibil["cibil_score"],
        on_time_payment_pct         = cibil["on_time_payment_pct"],
        existing_emi                = cibil["existing_emi"],
        hard_inquiries_12m          = cibil["hard_inquiries_12m"],
        credit_age_months           = cibil["credit_age_months"],
        has_existing_loan           = cibil["has_existing_loan"],
        existing_loan_amount        = cibil["existing_loan_amount"],
        declared_monthly_income     = declared_monthly_income,
        years_in_business           = years_in_business,
        city_tier                   = city_tier,
        business_type               = business_type,
    )

    # Build loan tiers
    base = result["safe_loan_amount"]
    emi_options = []
    if base > 0:
        for rate_mult, tenure, label in [(0.6, 12, "Conservative"), (1.0, 18, "Recommended"), (1.3, 24, "Maximum")]:
            amount = int(base * rate_mult)
            rate   = {1: 14.0, 2: 16.0, 3: 18.0}.get(city_tier, 16.0)
            r      = rate / 100 / 12
            n      = tenure
            emi    = round((amount * r * (1 + r) ** n) / ((1 + r) ** n - 1), 2)
            emi_options.append({
                "label":          label,
                "loan_amount":    amount,
                "tenure_months":  tenure,
                "interest_rate":  rate,
                "monthly_emi":    emi,
                "total_payable":  round(emi * tenure, 2),
                "total_interest": round(emi * tenure - amount, 2),
            })

    return {
        "ai_result":   result,
        "txn_data":    txn,
        "cibil_data":  cibil,
        "emi_options": emi_options,
    }
