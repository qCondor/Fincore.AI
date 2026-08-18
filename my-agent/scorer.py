DOMAIN_TRAIT_MAP = {
    'extraversion':          'extraversion',
    'agreeableness':         'agreeableness',
    'conscientiousness':     'conscientiousness',
    'negativeEmotionality':  'neuroticism',
    'openMindedness':        'openness',
}


def score_survey(answers: list[dict]) -> dict[str, int]:
    """
    Takes 60 structured answer objects and returns Big Five scores as percentages 0-100.
    Each item: {itemId, facet, domain, reverse, rating (1-5)}
    Reverse-scored items are inverted (6 - rating) before summing.
    Normalisation: (domain_sum - item_count) / (item_count * 4) * 100
    """
    domain_sums: dict[str, int] = {}
    domain_counts: dict[str, int] = {}

    for item in answers:
        trait = DOMAIN_TRAIT_MAP.get(item['domain'])
        if trait is None:
            continue
        rating: int = int(item['rating'])
        effective = 6 - rating if item['reverse'] else rating
        domain_sums[trait] = domain_sums.get(trait, 0) + effective
        domain_counts[trait] = domain_counts.get(trait, 0) + 1

    scores: dict[str, int] = {}
    for trait, total in domain_sums.items():
        count = domain_counts[trait]
        scores[trait] = round((total - count) / (count * 4) * 100)

    return scores
