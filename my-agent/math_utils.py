"""Psychology cost calculations based on OCEAN personality traits."""

def calculate_psychology_cost(
    base_price: float,
    big_five: dict,
    product_category: str = "general"
) -> dict:
    """
    Calculate the 'true psychological cost' of a purchase based on personality.

    Formula: base_price * (1 + personality_tax)

    Personality tax factors:
    - High Neuroticism (>=60): +20% (anxiety/guilt adds emotional cost)
    - Low Conscientiousness (<=40): +15% (impulse regret)
    - High Openness (>=70) for novel items: +10% (novelty premium)
    - High Extraversion (>=70) for social items: +10% (social pressure)
    - High Agreeableness (>=60): +5% (difficulty returning/refusing)

    Returns dict with:
    - psychology_cost: the adjusted price
    - base_price: original price
    - personality_tax: percentage added
    - breakdown: list of factors applied
    """
    o = big_five.get("openness", 50)
    c = big_five.get("conscientiousness", 50)
    e = big_five.get("extraversion", 50)
    a = big_five.get("agreeableness", 50)
    n = big_five.get("neuroticism", 50)

    tax = 0.0
    breakdown = []

    # Neuroticism: anxiety and guilt add emotional cost
    if n >= 60:
        factor = (n - 50) / 100  # 0.1 to 0.5 for scores 60-100
        tax += factor
        breakdown.append({
            "trait": "Neuroticism",
            "score": n,
            "factor": round(factor * 100),
            "reason": "Purchase anxiety and post-purchase guilt"
        })

    # Low Conscientiousness: impulse regret
    if c <= 40:
        factor = (50 - c) / 200  # 0.05 to 0.25 for scores 0-40
        tax += factor
        breakdown.append({
            "trait": "Conscientiousness",
            "score": c,
            "factor": round(factor * 100),
            "reason": "Impulse buying leads to regret"
        })

    # High Openness: novelty seeking
    if o >= 70:
        factor = (o - 60) / 200  # 0.05 to 0.2 for scores 70-100
        tax += factor
        breakdown.append({
            "trait": "Openness",
            "score": o,
            "factor": round(factor * 100),
            "reason": "Drawn to novel products over value"
        })

    # High Extraversion: social pressure
    if e >= 70:
        factor = (e - 60) / 250  # 0.04 to 0.16 for scores 70-100
        tax += factor
        breakdown.append({
            "trait": "Extraversion",
            "score": e,
            "factor": round(factor * 100),
            "reason": "Social situations increase spending"
        })

    # High Agreeableness: difficulty saying no
    if a >= 60:
        factor = (a - 50) / 400  # 0.025 to 0.125 for scores 60-100
        tax += factor
        breakdown.append({
            "trait": "Agreeableness",
            "score": a,
            "factor": round(factor * 100),
            "reason": "Hard to return items or refuse upsells"
        })

    psychology_cost = round(base_price * (1 + tax), 2)

    return {
        "base_price": base_price,
        "psychology_cost": psychology_cost,
        "personality_tax_percent": round(tax * 100, 1),
        "breakdown": breakdown,
        "savings_if_coached": round(psychology_cost - base_price, 2)
    }


def calculate_annual_impact(monthly_spend: float, big_five: dict) -> dict:
    """Calculate projected annual impact based on personality."""
    monthly_result = calculate_psychology_cost(monthly_spend, big_five)

    return {
        "monthly_actual": monthly_spend,
        "monthly_feels_like": monthly_result["psychology_cost"],
        "annual_actual": round(monthly_spend * 12, 2),
        "annual_feels_like": round(monthly_result["psychology_cost"] * 12, 2),
        "annual_personality_tax": round((monthly_result["psychology_cost"] - monthly_spend) * 12, 2),
        "breakdown": monthly_result["breakdown"]
    }
