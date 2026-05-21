from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models.models import Lender, LenderRule
from app.services.auth_service import get_current_user, require_role

router = APIRouter(tags=["lenders"])


class LenderCreate(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    min_loan: float = 10000
    max_loan: float = 500000


class LenderRuleCreate(BaseModel):
    city_tier: Optional[int] = None
    business_types: Optional[List[str]] = None
    min_cibil: int = 600
    max_risk_score: float = 40.0
    base_interest_rate: float = 16.0
    tier1_rate: float = 14.0
    tier2_rate: float = 16.0
    tier3_rate: float = 18.0
    max_emi_to_income: float = 0.5


@router.get("/")
def list_lenders(db: Session = Depends(get_db)):
    lenders = db.query(Lender).filter(Lender.is_active == True).all()
    return [_lender_dict(l) for l in lenders]


@router.post("/")
def create_lender(
    req: LenderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    lender = Lender(**req.dict())
    db.add(lender); db.commit(); db.refresh(lender)
    return _lender_dict(lender)


@router.post("/{lender_id}/rules")
def set_lender_rules(
    lender_id: int,
    req: LenderRuleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    lender = db.query(Lender).filter(Lender.id == lender_id).first()
    if not lender:
        raise HTTPException(404, "Lender not found")
    existing = db.query(LenderRule).filter(LenderRule.lender_id == lender_id).first()
    if existing:
        for k, v in req.dict().items():
            setattr(existing, k, v)
    else:
        db.add(LenderRule(lender_id=lender_id, **req.dict()))
    db.commit()
    return {"message": "Rules saved"}


@router.post("/seed")
def seed_lenders(db: Session = Depends(get_db)):
    """Seed demo lenders — call once after DB setup."""
    if db.query(Lender).count() > 0:
        return {"message": "Already seeded"}

    demo_lenders = [
        {"name": "MudraMFI",        "description": "Best rates for Kirana & grocery businesses", "min_loan": 10000, "max_loan": 300000,
         "rules": {"min_cibil": 580, "max_risk_score": 45, "tier1_rate": 13.5, "tier2_rate": 15.0, "tier3_rate": 17.0,
                   "business_types": ["Kirana/Grocery", "Retail", "Food & Beverage"]}},
        {"name": "FinGrow Capital",  "description": "Metro-focused, low interest for tier-1 cities", "min_loan": 25000, "max_loan": 500000,
         "rules": {"min_cibil": 650, "max_risk_score": 30, "tier1_rate": 12.0, "tier2_rate": 15.5, "tier3_rate": 18.5,
                   "city_tier": None, "business_types": None}},
        {"name": "Grameen Saathi",   "description": "Specialised for rural & tier-3 small businesses", "min_loan": 5000, "max_loan": 150000,
         "rules": {"min_cibil": 520, "max_risk_score": 50, "tier1_rate": 16.0, "tier2_rate": 17.0, "tier3_rate": 16.5,
                   "city_tier": 3, "business_types": None}},
        {"name": "SwiftLoan MFI",    "description": "Fast approvals, all business types", "min_loan": 15000, "max_loan": 400000,
         "rules": {"min_cibil": 600, "max_risk_score": 40, "tier1_rate": 14.5, "tier2_rate": 16.5, "tier3_rate": 18.0,
                   "city_tier": None, "business_types": None}},
    ]

    for d in demo_lenders:
        rules_data = d.pop("rules")
        lender = Lender(**d, is_active=True)
        db.add(lender); db.flush()
        db.add(LenderRule(lender_id=lender.id, **rules_data))

    db.commit()
    return {"message": f"Seeded {len(demo_lenders)} lenders"}


def _lender_dict(l: Lender):
    return {
        "id":          l.id,
        "name":        l.name,
        "description": l.description,
        "logo_url":    l.logo_url,
        "min_loan":    l.min_loan,
        "max_loan":    l.max_loan,
    }
