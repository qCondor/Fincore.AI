export interface Question {
  id: number;
  facet: string;
  domain: "Openness" | "Conscientiousness" | "Extraversion" | "Agreeableness" | "Neuroticism";
  text: string;
  hint: string;
  options: [string, string, string, string]; // A, B, C, D
}

export const questions: Question[] = [
  // Openness (Q1-3)
  {
    id: 1,
    facet: "Adventure",
    domain: "Openness",
    text: "A friend invites you on a spontaneous weekend trip abroad.",
    hint: "How do you respond?",
    options: [
      "Book it immediately — life's too short!",
      "Check your budget first, then decide",
      "Politely decline — you prefer planned holidays",
      "Hard no — spontaneous spending stresses you out",
    ],
  },
  {
    id: 2,
    facet: "Novelty",
    domain: "Openness",
    text: "Your favourite brand drops a new limited-edition product.",
    hint: "What's your move?",
    options: [
      "Buy it straight away before it sells out",
      "Add it to your wishlist and sleep on it",
      "Wait for reviews and maybe a sale",
      "Ignore it — you stick with what you know",
    ],
  },
  {
    id: 3,
    facet: "Risk Appetite",
    domain: "Openness",
    text: "A colleague suggests investing in crypto.",
    hint: "How do you react?",
    options: [
      "Exciting! You research it that evening",
      "Interesting — you'd consider a small amount",
      "Too risky — you prefer traditional savings",
      "No chance — you avoid anything speculative",
    ],
  },

  // Conscientiousness (Q4-6)
  {
    id: 4,
    facet: "Impulse Control",
    domain: "Conscientiousness",
    text: "It's payday. What happens first?",
    hint: "Be honest!",
    options: [
      "Treat yourself — you've earned it",
      "Move savings first, then spend freely",
      "Check your bills, then allocate the rest",
      "Nothing changes — you budget monthly anyway",
    ],
  },
  {
    id: 5,
    facet: "Organisation",
    domain: "Conscientiousness",
    text: "You notice an unused subscription on your bank statement.",
    hint: "What do you do?",
    options: [
      "Ignore it — it's only a few quid",
      "Cancel it immediately",
      "Keep meaning to cancel, but forget",
      "Keep it 'just in case'",
    ],
  },
  {
    id: 6,
    facet: "Planning",
    domain: "Conscientiousness",
    text: "You want to save for a holiday in three months.",
    hint: "How do you approach it?",
    options: [
      "Set up automatic transfers right now",
      "Try to save, but dip into it sometimes",
      "Plan to save, but rarely follow through",
      "Wing it — you'll figure it out closer to the time",
    ],
  },

  // Extraversion (Q7-9)
  {
    id: 7,
    facet: "Social Spending",
    domain: "Extraversion",
    text: "Your group chat lights up with Friday night plans.",
    hint: "What's your typical response?",
    options: [
      "You're in — already suggesting venues",
      "Sounds fun, but you check your budget first",
      "You'd rather a quiet night with close friends",
      "Pass — you prefer staying in",
    ],
  },
  {
    id: 8,
    facet: "Group Influence",
    domain: "Extraversion",
    text: "Do you spend more when shopping alone or with friends?",
    hint: "Think about your recent purchases.",
    options: [
      "Way more with friends — it's part of the fun",
      "Slightly less alone — no peer pressure",
      "About the same either way",
      "Much less alone — friends encourage impulse buys",
    ],
  },
  {
    id: 9,
    facet: "Sharing",
    domain: "Extraversion",
    text: "You get a surprise pay rise.",
    hint: "Who finds out?",
    options: [
      "Everyone — you celebrate loudly",
      "Close friends and family",
      "Just your partner or best mate",
      "No one — money is private",
    ],
  },

  // Agreeableness (Q10-12)
  {
    id: 10,
    facet: "Lending",
    domain: "Agreeableness",
    text: "A flatmate asks to borrow money until payday.",
    hint: "What do you do?",
    options: [
      "Of course — you'd do anything to help",
      "Yes, but you set a clear repayment date",
      "Maybe a small amount, reluctantly",
      "No — lending money ruins friendships",
    ],
  },
  {
    id: 11,
    facet: "Boundaries",
    domain: "Agreeableness",
    text: "At a group dinner, someone orders way more than you.",
    hint: "The bill arrives to split evenly.",
    options: [
      "Pay your share to avoid awkwardness",
      "Suggest splitting, but back down if pushed",
      "Offer to split by what each person ordered",
      "Insist on paying only for what you had",
    ],
  },
  {
    id: 12,
    facet: "Generosity",
    domain: "Agreeableness",
    text: "A charity worker approaches you on the street.",
    hint: "How do you typically respond?",
    options: [
      "Sign up — it's hard to say no to a good cause",
      "Politely listen, then decide",
      "Keep walking — you give in your own time",
      "Firmly decline — you dislike pressure tactics",
    ],
  },

  // Neuroticism (Q13-15)
  {
    id: 13,
    facet: "Money Anxiety",
    domain: "Neuroticism",
    text: "You check your bank balance and it's lower than expected.",
    hint: "How do you feel?",
    options: [
      "Panicked — where did it all go?",
      "Worried — you need to review your spending",
      "Mildly concerned, but you'll sort it",
      "Unfazed — these things happen",
    ],
  },
  {
    id: 14,
    facet: "Guilt",
    domain: "Neuroticism",
    text: "After an impulse purchase, how long does the guilt last?",
    hint: "Be honest with yourself.",
    options: [
      "Days — you replay the decision constantly",
      "A few hours of second-guessing",
      "A brief pang, then you move on",
      "No guilt — you trust your choices",
    ],
  },
  {
    id: 15,
    facet: "Comparison",
    domain: "Neuroticism",
    text: "How often do you compare your finances to friends or colleagues?",
    hint: "Social media counts too.",
    options: [
      "Constantly — it affects your mood",
      "Occasionally, and it stresses you out",
      "Sometimes, but it doesn't bother you much",
      "Rarely — you focus on your own journey",
    ],
  },
];

export const traitColors: Record<string, { from: string; to: string }> = {
  Openness: { from: "#005FCC", to: "#00C2FF" },
  Conscientiousness: { from: "#34C759", to: "#30D158" },
  Extraversion: { from: "#FF9F0A", to: "#FECA57" },
  Agreeableness: { from: "#FF3B30", to: "#FF6B6B" },
  Neuroticism: { from: "#5AC8FA", to: "#007AFF" },
};

export const traitDescriptions: Record<string, { high: string; low: string; tip: string }> = {
  Openness: {
    high: "Your high openness makes you naturally drawn to novelty — new products, experiences, and ideas light you up.",
    low: "You prefer proven, familiar approaches — trendy products and speculative investments don't appeal to you.",
    tip: "Channel your curiosity into free experiences like museums, podcasts, and library books.",
  },
  Conscientiousness: {
    high: "You're a disciplined planner who thrives with structure, budgets, and step-by-step breakdowns.",
    low: "You tend to wing it financially — rigid budgets feel restrictive and you often spend impulsively.",
    tip: "Automate your savings with standing orders so planning happens without effort.",
  },
  Extraversion: {
    high: "Social situations energise you, but they can quietly drain your account — nights out, rounds, and group activities add up.",
    low: "You're an independent decision-maker who isn't swayed by social pressure to spend.",
    tip: "Suggest free or cheaper social plans first — your friends won't mind.",
  },
  Agreeableness: {
    high: "You find it hard to say no — splitting bills, lending money, and buying rounds even when you shouldn't.",
    low: "You're assertive with money and good at setting boundaries, though generosity may feel unnatural.",
    tip: "Practice saying 'I'll get the next one' — it's a boundary that preserves the friendship.",
  },
  Neuroticism: {
    high: "Money makes you anxious — unexpected expenses, dips in your balance, and financial decisions cause stress.",
    low: "You're relaxed about finances, but may under-monitor your accounts and miss warning signs.",
    tip: "Set one calm review day per month instead of checking impulsively.",
  },
};
