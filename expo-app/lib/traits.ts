export const traitMetadata: Record<string, {
  letter: string;
  definition: string;
  subtraits: { name: string; highInsight: string; lowInsight: string }[];
  highProfile: string;
  lowProfile: string;
  highFaith: string;
  lowFaith: string;
  tip: string;
}> = {
  openness: {
    letter: 'O',
    definition: 'How curious and open you are to new ideas, experiences, and unconventional thinking.',
    subtraits: [
      { name: 'Intellectual Curiosity', highInsight: 'You research before buying but get drawn into new finds', lowInsight: 'You stick with familiar brands and products' },
      { name: 'Aesthetic Sensitivity', highInsight: 'Visual appeal strongly influences your purchases', lowInsight: 'Function matters more than form to you' },
      { name: 'Creative Imagination', highInsight: 'You gravitate toward novel products and experiences', lowInsight: 'You prefer tried-and-tested options' },
    ],
    highProfile: 'Novelty drives your spending. New releases and unique finds bypass your rational filters.',
    lowProfile: 'You prefer the familiar and proven. Trendy products rarely tempt you.',
    highFaith: 'Faith will flag novelty-driven impulse buys and suggest free alternatives.',
    lowFaith: 'Faith will occasionally introduce new options that might genuinely serve you better.',
    tip: 'Channel your curiosity into free experiences like museums, podcasts, and library books.',
  },
  conscientiousness: {
    letter: 'C',
    definition: 'How structured, disciplined, and goal-oriented you are in daily life.',
    subtraits: [
      { name: 'Organisation', highInsight: 'You meticulously track every expense', lowInsight: 'You loosely track finances but miss recurring costs' },
      { name: 'Productiveness', highInsight: 'You follow through on financial plans', lowInsight: 'You can stick to plans but often choose not to' },
      { name: 'Responsibility', highInsight: 'Long-term goals guide your spending', lowInsight: 'Short-term wants sometimes override long-term commitments' },
    ],
    highProfile: 'You thrive with structure. Budgets and plans keep you on track.',
    lowProfile: 'You default to spontaneity. Subscriptions and unreviewed spending drift unchecked.',
    highFaith: 'Faith will help optimise your already solid financial habits.',
    lowFaith: 'Faith will nudge you when spending drifts from your goals.',
    tip: 'Automate your savings with standing orders so planning happens without effort.',
  },
  extraversion: {
    letter: 'E',
    definition: 'How energised and motivated you are by social interaction and group activity.',
    subtraits: [
      { name: 'Sociability', highInsight: 'You spend more in groups than when alone', lowInsight: 'You spend consistently whether alone or with others' },
      { name: 'Assertiveness', highInsight: "You're quick to suggest plans, often costly ones", lowInsight: 'You rarely initiate expensive social plans' },
      { name: 'Energy Level', highInsight: 'A busy social calendar means frequent spending', lowInsight: 'Your quieter lifestyle keeps social spending low' },
    ],
    highProfile: 'Social situations are your biggest financial blind spot. Rounds and spontaneous nights out add up fast.',
    lowProfile: 'You make independent financial decisions without social pressure.',
    highFaith: 'Faith will track social spending and suggest lower-cost alternatives.',
    lowFaith: 'Faith will help you find value in occasional social experiences.',
    tip: "Suggest free or cheaper social plans first — your friends won't mind.",
  },
  agreeableness: {
    letter: 'A',
    definition: 'How cooperative, trusting, and conflict-averse you are in social situations.',
    subtraits: [
      { name: 'Compassion', highInsight: 'You over-tip and over-gift to avoid seeming tight', lowInsight: 'You tip and gift based on merit, not guilt' },
      { name: 'Respectfulness', highInsight: 'You split bills evenly even when you spent less', lowInsight: 'You confidently pay only for what you ordered' },
      { name: 'Trust', highInsight: 'You lend money without expecting it back', lowInsight: 'You set clear terms when lending money' },
    ],
    highProfile: 'Saying no feels harder than overspending. You absorb costs to keep the peace.',
    lowProfile: 'You set firm boundaries with money and rarely overspend to please others.',
    highFaith: 'Faith will help you set boundaries without straining relationships.',
    lowFaith: 'Faith will remind you when generosity might strengthen key relationships.',
    tip: "Practice saying 'I'll get the next one' — it's a boundary that preserves the friendship.",
  },
  neuroticism: {
    letter: 'N',
    definition: 'How sensitive you are to stress, worry, and emotional fluctuations.',
    subtraits: [
      { name: 'Anxiety', highInsight: 'Money stress keeps you up at night', lowInsight: "Money stress rarely keeps you up at night" },
      { name: 'Depression', highInsight: 'Low mood triggers comfort spending', lowInsight: "Low mood doesn't trigger comfort spending for you" },
      { name: 'Emotional Volatility', highInsight: 'Your spending fluctuates with your mood', lowInsight: 'You stay steady but overlook small financial leaks' },
    ],
    highProfile: 'Stress and anxiety drive emotional spending. You need calm reassurance around money.',
    lowProfile: "Your calm is a strength, but financial red flags don't trigger alarm bells.",
    highFaith: 'Faith will provide calm, concrete guidance when money feels overwhelming.',
    lowFaith: "Faith will schedule check-ins to surface patterns you'd naturally overlook.",
    tip: 'Set one calm review day per month instead of checking impulsively.',
  },
};
