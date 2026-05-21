"""EMI Calculation Engine — EMI = (P × r × (1+r)^n) / ((1+r)^n - 1)"""

from typing import List


def calculate_emi(principal: float, annual_rate: float, tenure_months: int) -> dict:
    r = annual_rate / 100 / 12
    n = tenure_months
    if r == 0:
        emi = principal / n
    else:
        emi = (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1)
    total_payable  = round(emi * n, 2)
    total_interest = round(total_payable - principal, 2)
    return {
        "loan_amount":    round(principal, 2),
        "tenure_months":  n,
        "interest_rate":  annual_rate,
        "monthly_emi":    round(emi, 2),
        "total_payable":  total_payable,
        "total_interest": total_interest,
    }


def get_rate_for_tier(base_rate: float, city_tier: int) -> float:
    adjustment = {1: -2.0, 2: 0.0, 3: 2.0}
    return base_rate + adjustment.get(city_tier, 0.0)


def generate_emi_options(
    loan_amount: float,
    city_tier: int,
    base_rate: float = 16.0
) -> List[dict]:
    rate    = get_rate_for_tier(base_rate, city_tier)
    tenures = [6, 12, 18, 24, 36]
    options = []
    for t in tenures:
        opt = calculate_emi(loan_amount, rate, t)
        opt["label"] = f"{t} months"
        options.append(opt)
    return options
