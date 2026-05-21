"""Lender Matching Engine"""

from sqlalchemy.orm import Session
from app.models.models import Lender, LenderRule
from app.services.emi_service import get_rate_for_tier, calculate_emi
from typing import List


def match_lenders(
    db: Session,
    business_type: str,
    city_tier: int,
    cibil_score: int,
    default_probability: float,
    loan_amount: float,
    safe_loan_amount: float,
) -> List[dict]:
    lenders = db.query(Lender).filter(Lender.is_active == True).all()
    matched = []

    for lender in lenders:
        rules = db.query(LenderRule).filter(LenderRule.lender_id == lender.id).first()
        if not rules:
            continue

        # City tier check
        if rules.city_tier and rules.city_tier != city_tier:
            continue

        # Business type check
        if rules.business_types and business_type not in rules.business_types:
            continue

        # CIBIL check
        if cibil_score < rules.min_cibil:
            continue

        # Risk check
        if default_probability * 100 > rules.max_risk_score:
            continue

        # Loan range check
        if loan_amount < lender.min_loan or loan_amount > lender.max_loan:
            continue

        # Calculate rate for this lender + city tier
        rate_map = {1: rules.tier1_rate, 2: rules.tier2_rate, 3: rules.tier3_rate}
        rate = rate_map.get(city_tier, rules.base_interest_rate)

        emi_18 = calculate_emi(loan_amount, rate, 18)

        matched.append({
            "lender_id":    lender.id,
            "name":         lender.name,
            "logo_url":     lender.logo_url,
            "description":  lender.description,
            "interest_rate": rate,
            "min_loan":     lender.min_loan,
            "max_loan":     lender.max_loan,
            "sample_emi":   emi_18["monthly_emi"],
            "match_score":  _compute_match_score(cibil_score, default_probability, city_tier, rules),
        })

    matched.sort(key=lambda x: x["match_score"], reverse=True)
    return matched


def _compute_match_score(cibil_score, default_probability, city_tier, rules) -> float:
    score = 0.0
    score += min(cibil_score / 900, 1.0) * 40
    score += (1 - default_probability) * 40
    if rules.city_tier is None or rules.city_tier == city_tier:
        score += 20
    return round(score, 1)
