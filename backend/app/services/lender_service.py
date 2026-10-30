
"""Lender Matching Engine"""

from sqlalchemy.orm import Session
from typing import List

from app.models.models import Lender, LenderRule
from app.services.emi_service import calculate_emi


def match_lenders(
    db: Session,
    business_type: str,
    city_tier: int,
    cibil_score: int,
    default_probability: float,
    loan_amount: float,
    safe_loan_amount: float,
) -> List[dict]:

    matched = []

    # Normalize applicant information
    business_type = str(business_type or "").strip().casefold()

    try:
        city_tier = int(city_tier)
        cibil_score = int(cibil_score)
        safe_limit = float(safe_loan_amount or 0)
        requested_amount = float(loan_amount or 0)
        risk_probability = float(default_probability or 0)
    except (TypeError, ValueError):
        print("Invalid applicant data supplied to lender matching.")
        return matched

    # Support both probability formats:
    # 0.30 means 30%, and 30 means 30%.
    if risk_probability > 1:
        risk_probability = risk_probability / 100

    risk_percentage = risk_probability * 100

    print("\n========== LENDER MATCHING ==========")
    print("Business:", business_type)
    print("City tier:", city_tier)
    print("CIBIL:", cibil_score)
    print("Default risk (%):", risk_percentage)
    print("Safe loan limit:", safe_limit)

    if safe_limit <= 0:
        print("REJECTED: AI safe loan limit is zero or invalid.")
        print("TOTAL MATCHED: 0")
        print("=====================================\n")
        return matched

    # Fetch active lenders
    lenders = db.query(Lender).filter(
        Lender.is_active.is_(True)
    ).all()

    print("Active lenders:", len(lenders))

    if not lenders:
        print("No active lenders found in database.")

    for lender in lenders:

        try:
            rules = db.query(LenderRule).filter(
                LenderRule.lender_id == lender.id
            ).first()

            if not rules:
                print(f"REJECTED {lender.name}: No lender rules")
                continue

            # ---------------------------------
            # 1. City tier validation
            # ---------------------------------
            if rules.city_tier is not None:
                if int(rules.city_tier) != city_tier:
                    print(f"REJECTED {lender.name}: City tier mismatch")
                    continue

            # ---------------------------------
            # 2. Business type validation
            # ---------------------------------
            accepted_types = rules.business_types or []

            if isinstance(accepted_types, str):
                accepted_types = [accepted_types]

            if accepted_types:
                accepted = {
                    str(item).strip().casefold()
                    for item in accepted_types
                }

                if business_type not in accepted:
                    print(
                        f"REJECTED {lender.name}: "
                        f"Business type mismatch. Accepted: {accepted}"
                    )
                    continue

            # ---------------------------------
            # 3. CIBIL validation
            # ---------------------------------
            minimum_cibil = int(rules.min_cibil or 0)

            if cibil_score < minimum_cibil:
                print(
                    f"REJECTED {lender.name}: "
                    f"CIBIL {cibil_score} below {minimum_cibil}"
                )
                continue

            # ---------------------------------
            # 4. Default risk validation
            # ---------------------------------
            maximum_risk = float(
                rules.max_risk_score
                if rules.max_risk_score is not None
                else 100
            )

            if risk_percentage > maximum_risk:
                print(
                    f"REJECTED {lender.name}: "
                    f"Risk {risk_percentage:.2f}% exceeds "
                    f"{maximum_risk:.2f}%"
                )
                continue

            # ---------------------------------
            # 5. Loan range validation
            # ---------------------------------
            minimum_loan = float(lender.min_loan or 0)
            maximum_loan = float(lender.max_loan or 0)

            if maximum_loan <= 0 or minimum_loan < 0:
                print(f"REJECTED {lender.name}: Invalid loan range")
                continue

            # Find the overlap between the lender's
            # loan range and the AI-approved limit.
            feasible_min = minimum_loan
            feasible_max = min(maximum_loan, safe_limit)

            if feasible_min > feasible_max:
                print(
                    f"REJECTED {lender.name}: "
                    f"No loan range overlap "
                    f"(min={minimum_loan}, max={maximum_loan}, "
                    f"safe_limit={safe_limit})"
                )
                continue

            # Select a valid amount for sample EMI calculation.
            if requested_amount > 0:
                sample_amount = min(
                    max(requested_amount, feasible_min),
                    feasible_max
                )
            else:
                sample_amount = feasible_max

            # ---------------------------------
            # 6. Interest rate calculation
            # ---------------------------------
            rate_map = {
                1: rules.tier1_rate,
                2: rules.tier2_rate,
                3: rules.tier3_rate,
            }

            rate = rate_map.get(city_tier)

            if rate is None:
                rate = rules.base_interest_rate

            rate = float(rate or 0)

            if rate <= 0:
                print(f"REJECTED {lender.name}: Invalid interest rate")
                continue

            # ---------------------------------
            # 7. EMI calculation
            # ---------------------------------
            emi_result = calculate_emi(
                sample_amount,
                rate,
                18
            )

            if not emi_result:
                print(f"REJECTED {lender.name}: EMI calculation failed")
                continue

            monthly_emi = float(emi_result["monthly_emi"])

            # ---------------------------------
            # 8. Match score
            # ---------------------------------
            score = _compute_match_score(
                cibil_score,
                risk_probability,
                city_tier,
                rules
            )

            # ---------------------------------
            # 9. Add matched lender
            # ---------------------------------
            matched.append({
                "lender_id": lender.id,
                "name": lender.name,
                "logo_url": lender.logo_url,
                "description": lender.description,
                "interest_rate": rate,
                "min_loan": minimum_loan,
                "max_loan": maximum_loan,
                "sample_emi": monthly_emi,
                "match_score": score,
            })

            print(
                f"ELIGIBLE: {lender.name} | "
                f"Sample amount: {sample_amount} | "
                f"Interest: {rate}%"
            )

        except (TypeError, ValueError, KeyError) as exc:
            print(f"REJECTED {lender.name}: Invalid lender data: {exc}")
            continue

        except Exception as exc:
            print(f"ERROR processing {lender.name}: {exc}")
            continue

    # Highest match score first
    matched.sort(
        key=lambda lender: lender["match_score"],
        reverse=True
    )

    print("\nTOTAL MATCHED:", len(matched))
    print("=====================================\n")

    return matched


def _compute_match_score(
    cibil_score,
    default_probability,
    city_tier,
    rules
) -> float:

    score = 0.0

    # CIBIL contribution: maximum 40 points
    score += min(max(float(cibil_score), 0) / 900, 1.0) * 40

    # Risk contribution: maximum 40 points
    risk = max(0.0, min(float(default_probability), 1.0))
    score += (1 - risk) * 40

    # City tier contribution: maximum 20 points
    if rules.city_tier is None or int(rules.city_tier) == int(city_tier):
        score += 20

    return round(min(score, 100), 1)
