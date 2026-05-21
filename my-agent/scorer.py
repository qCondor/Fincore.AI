# Maps each question's A/B/C/D answer to a trait score (1-4).
# Questions are grouped: Q1-3 Openness, Q4-6 Conscientiousness,
# Q7-9 Extraversion, Q10-12 Agreeableness, Q13-15 Neuroticism.

SCORING_TABLE = [
    # Q1 — Openness: spontaneous trip
    {"A": 4, "B": 3, "C": 2, "D": 1},
    # Q2 — Openness: new brand drop
    {"A": 4, "B": 3, "C": 2, "D": 1},
    # Q3 — Openness: crypto suggestion
    {"A": 4, "B": 3, "C": 2, "D": 1},

    # Q4 — Conscientiousness: payday behaviour (A is lowest — impulse treat)
    {"A": 1, "B": 4, "C": 3, "D": 2},
    # Q5 — Conscientiousness: unused subscription
    {"A": 2, "B": 4, "C": 1, "D": 1},
    # Q6 — Conscientiousness: 3-month holiday savings plan
    {"A": 4, "B": 2, "C": 1, "D": 1},

    # Q7 — Extraversion: Friday night group plans
    {"A": 4, "B": 3, "C": 2, "D": 1},
    # Q8 — Extraversion: solo vs group shopping spend
    {"A": 4, "B": 2, "C": 3, "D": 1},
    # Q9 — Extraversion: sharing a pay rise
    {"A": 4, "B": 3, "C": 2, "D": 1},

    # Q10 — Agreeableness: flatmate borrows money
    {"A": 4, "B": 3, "C": 2, "D": 1},
    # Q11 — Agreeableness: unequal dinner bill (A=avoid conflict, D=assert)
    {"A": 4, "B": 2, "C": 3, "D": 1},
    # Q12 — Agreeableness: charity street worker
    {"A": 4, "B": 3, "C": 2, "D": 1},

    # Q13 — Neuroticism: bank balance lower than expected
    {"A": 4, "B": 3, "C": 2, "D": 1},
    # Q14 — Neuroticism: purchase guilt duration
    {"A": 4, "B": 3, "C": 2, "D": 1},
    # Q15 — Neuroticism: financial comparison to peers
    {"A": 4, "B": 3, "C": 2, "D": 1},
]

TRAITS = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]


def score_survey(answers: list[str]) -> dict[str, int]:
    """
    Takes 15 answers (e.g. ["A", "C", "B", ...]) and returns Big Five
    scores as percentages 0-100.
    """
    if len(answers) != 15:
        raise ValueError(f"Expected 15 answers, got {len(answers)}")

    raw = []
    for i, answer in enumerate(answers):
        answer = answer.upper().strip()
        if answer not in SCORING_TABLE[i]:
            raise ValueError(f"Answer {answer!r} is not valid for question {i + 1}")
        raw.append(SCORING_TABLE[i][answer])

    # Sum each trait (3 questions each), then normalise to 0-100
    # Raw range per trait: 3 (all 1s) to 12 (all 4s)
    scores = {}
    for i, trait in enumerate(TRAITS):
        trait_raw = sum(raw[i * 3 : i * 3 + 3])
        scores[trait] = round((trait_raw - 3) / 9 * 100)

    return scores
