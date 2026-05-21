from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.models import Application, AIReport, UploadedFile, EMIOption, BlockchainTransaction, User
from app.services.auth_service import get_current_user, require_role
from app.services.ai_service import run_full_analysis
from app.services.emi_service import generate_emi_options
from app.services.lender_service import match_lenders
from app.services.blockchain_service import write_application_to_chain, update_status_on_chain
from app.services.s3_service import upload_file

router = APIRouter(tags=["applications"])


# ── Step 1: Create application + upload files + run AI ─────────────────
@router.post("/analyze")
async def analyze(
    csv_file: UploadFile = File(...),
    cibil_file: UploadFile = File(...),
    declared_monthly_income: float = Form(...),
    years_in_business: float = Form(...),
    city_tier: int = Form(...),
    business_type: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    csv_bytes   = await csv_file.read()
    cibil_bytes = await cibil_file.read()

    # Run AI pipeline
    analysis = run_full_analysis(
        csv_bytes, cibil_bytes,
        declared_monthly_income, years_in_business, city_tier, business_type
    )

    # Create application record
    app = Application(
        user_id=current_user.id,
        declared_monthly_income=declared_monthly_income,
        years_in_business=years_in_business,
        city_tier=city_tier,
        business_type=business_type,
        status="ai_analyzed",
    )
    db.add(app); db.commit(); db.refresh(app)

    # Save AI report
    # Save AI report
    # Save AI report
    r = analysis["ai_result"]
    report = AIReport(
        application_id      = app.id,
        trust_score         = int(r["trust_score"]),
        default_probability = float(r["default_probability"]),
        risk_category       = r["risk_category"],
        safe_loan_amount    = float(r["safe_loan_amount"]),
        anomaly_risk_pct    = float(r["anomaly_risk_pct"]),
        anomaly_flagged     = bool(r["anomaly_flagged"]),
        income_consistency  = float(r["income_consistency"]),
        credit_debit_ratio  = float(r["credit_debit_ratio"]),
        emi_to_income_ratio = float(r["emi_to_income_ratio"]),
        txn_data            = analysis["txn_data"],
        cibil_data          = analysis["cibil_data"],
        full_result         = analysis,
    )
    db.add(report)

    # Save EMI options
    for opt in analysis["emi_options"]:
        db.add(EMIOption(
            application_id = app.id,
            loan_amount    = opt["loan_amount"],
            tenure_months  = opt["tenure_months"],
            interest_rate  = opt["interest_rate"],
            monthly_emi    = opt["monthly_emi"],
            total_payable  = opt["total_payable"],
            total_interest = opt["total_interest"],
        ))

    # Save file records (upload to S3)
    csv_key   = f"applications/{app.id}/transactions.csv"
    cibil_key = f"applications/{app.id}/cibil_report.html"
    upload_file(csv_bytes, csv_key, "text/csv")
    upload_file(cibil_bytes, cibil_key, "text/html")

    db.add(UploadedFile(application_id=app.id, file_type="transactions_csv",
                        s3_key=csv_key, original_filename=csv_file.filename))
    db.add(UploadedFile(application_id=app.id, file_type="cibil_html",
                        s3_key=cibil_key, original_filename=cibil_file.filename))

    db.commit()

    # Match lenders
    matched_lenders = match_lenders(
        db, business_type, city_tier,
        analysis["cibil_data"]["cibil_score"],
        r["default_probability"],
        r["safe_loan_amount"],
        r["safe_loan_amount"],
    )

    return {
        "application_id": app.id,
        "ai_result":      r,
        "txn_data":       analysis["txn_data"],
        "cibil_data":     analysis["cibil_data"],
        "emi_options":    analysis["emi_options"],
        "matched_lenders": matched_lenders,
    }


# ── Step 2: User selects lender + EMI and submits ──────────────────────
class SubmitRequest(BaseModel):
    application_id: int
    lender_id: int
    requested_loan_amount: float
    selected_emi_months: int
    selected_emi_amount: float
    selected_interest_rate: float


@router.post("/submit")
def submit_application(
    req: SubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(Application).filter(
        Application.id == req.application_id,
        Application.user_id == current_user.id
    ).first()
    if not app:
        raise HTTPException(404, "Application not found")

    report = app.ai_report
    if req.requested_loan_amount > report.safe_loan_amount:
        raise HTTPException(400, f"Requested amount exceeds AI approved limit of ₹{report.safe_loan_amount:,.0f}")

    app.lender_id               = req.lender_id
    app.requested_loan_amount   = req.requested_loan_amount
    app.selected_emi_months     = req.selected_emi_months
    app.selected_emi_amount     = req.selected_emi_amount
    app.selected_interest_rate  = req.selected_interest_rate
    app.status                  = "submitted"
    db.commit()

    # Write to blockchain
    chain_data = {
        "application_id": app.id,
        "user_id":        current_user.id,
        "lender_id":      req.lender_id,
        "loan_amount":    req.requested_loan_amount,
        "trust_score":    report.trust_score,
        "risk_category":  report.risk_category,
    }
    result = write_application_to_chain(app.id, chain_data)
    if result.get("tx_hash"):
        app.blockchain_tx_hash = result["tx_hash"]
        db.add(BlockchainTransaction(
            application_id=app.id,
            tx_hash=result["tx_hash"],
            action="submitted",
            data_hash=result["data_hash"],
            block_number=result.get("block_number"),
        ))
    db.commit()

    return {"message": "Application submitted successfully", "application_id": app.id,
            "blockchain": result}


# ── Get user's own applications ────────────────────────────────────────
@router.get("/my")
def my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    return [_app_summary(a) for a in apps]


@router.get("/{application_id}")
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(404, "Not found")
    if app.user_id != current_user.id and current_user.role not in ("lender", "admin"):
        raise HTTPException(403, "Access denied")

    return _app_full(app)


# ── Lender actions ─────────────────────────────────────────────────────
class LenderActionRequest(BaseModel):
    action: str              # approve | reject | modify | request_docs
    note: Optional[str] = None
    modified_loan_amount: Optional[float] = None
    modified_emi: Optional[float] = None


@router.post("/{application_id}/lender-action")
def lender_action(
    application_id: int,
    req: LenderActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("lender")),
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(404, "Not found")

    status_map = {
        "approve":       "approved",
        "reject":        "rejected",
        "modify":        "modified",
        "request_docs":  "docs_requested",
    }
    new_status = status_map.get(req.action)
    if not new_status:
        raise HTTPException(400, "Invalid action")

    app.status       = new_status
    app.lender_note  = req.note
    if req.modified_loan_amount: app.modified_loan_amount = req.modified_loan_amount
    if req.modified_emi:         app.modified_emi = req.modified_emi
    db.commit()

    # Write status update to blockchain
    result = update_status_on_chain(app.id, new_status)
    if result.get("tx_hash"):
        db.add(BlockchainTransaction(
            application_id=app.id,
            tx_hash=result["tx_hash"],
            action=req.action,
            data_hash="",
        ))
        db.commit()

    return {"message": f"Application {new_status}", "blockchain": result}


# ── Lender dashboard — all applications for this lender ───────────────
@router.get("/lender/dashboard")
def lender_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("lender")),
):
    lender = db.query(Application).filter(
        Application.lender_id.isnot(None)
    ).all()
    return [_app_full(a) for a in lender]


# ── Helpers ────────────────────────────────────────────────────────────
def _app_summary(app):
    return {
        "id":            app.id,
        "status":        app.status,
        "business_type": app.business_type,
        "city_tier":     app.city_tier,
        "loan_amount":   app.requested_loan_amount,
        "created_at":    str(app.created_at),
        "lender_name":   app.lender.name if app.lender else None,
    }


def _app_full(app):
    report = app.ai_report
    return {
        "id":                    app.id,
        "status":                app.status,
        "business_type":         app.business_type,
        "city_tier":             app.city_tier,
        "declared_income":       app.declared_monthly_income,
        "years_in_business":     app.years_in_business,
        "requested_loan_amount": app.requested_loan_amount,
        "selected_emi_months":   app.selected_emi_months,
        "selected_emi_amount":   app.selected_emi_amount,
        "lender_note":           app.lender_note,
        "modified_loan_amount":  app.modified_loan_amount,
        "blockchain_tx":         app.blockchain_tx_hash,
        "created_at":            str(app.created_at),
        "lender":                {"id": app.lender.id, "name": app.lender.name} if app.lender else None,
        "ai_report": {
            "trust_score":         report.trust_score,
            "risk_category":       report.risk_category,
            "default_probability": report.default_probability,
            "safe_loan_amount":    report.safe_loan_amount,
            "anomaly_flagged":     report.anomaly_flagged,
            "anomaly_risk_pct":    report.anomaly_risk_pct,
            "income_consistency":  report.income_consistency,
            "credit_debit_ratio":  report.credit_debit_ratio,
            "emi_to_income_ratio": report.emi_to_income_ratio,
            "txn_data":            report.txn_data,
            "cibil_data":          report.cibil_data,
        } if report else None,
        "emi_options": [
            {
                "tenure_months":  e.tenure_months,
                "interest_rate":  e.interest_rate,
                "monthly_emi":    e.monthly_emi,
                "total_payable":  e.total_payable,
                "total_interest": e.total_interest,
            }
            for e in app.emi_options
        ],
        "blockchain_txns": [
            {"action": t.action, "tx_hash": t.tx_hash, "created_at": str(t.created_at)}
            for t in app.blockchain_txns
        ],
    }
