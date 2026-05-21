import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const traitColors: Record<string, { from: string; to: string }> = {
  Openness: { from: '#005FCC', to: '#00C2FF' },
  Conscientiousness: { from: '#34C759', to: '#30D158' },
  Extraversion: { from: '#FF9F0A', to: '#FECA57' },
  Agreeableness: { from: '#FF3B30', to: '#FF6B6B' },
  Neuroticism: { from: '#5AC8FA', to: '#007AFF' },
};

const traitDescriptions: Record<string, { high: string; low: string; tip: string }> = {
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

// Default/fallback scores
const defaultScores = {
  Openness: 72,
  Conscientiousness: 58,
  Extraversion: 65,
  Agreeableness: 71,
  Neuroticism: 38,
};

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ scores?: string }>();
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);

  // Parse scores from params or use defaults
  const scores = React.useMemo(() => {
    if (params.scores) {
      try {
        const parsed = JSON.parse(params.scores);
        // Backend returns lowercase keys, map to title case
        return {
          Openness: parsed.openness ?? parsed.Openness ?? defaultScores.Openness,
          Conscientiousness: parsed.conscientiousness ?? parsed.Conscientiousness ?? defaultScores.Conscientiousness,
          Extraversion: parsed.extraversion ?? parsed.Extraversion ?? defaultScores.Extraversion,
          Agreeableness: parsed.agreeableness ?? parsed.Agreeableness ?? defaultScores.Agreeableness,
          Neuroticism: parsed.neuroticism ?? parsed.Neuroticism ?? defaultScores.Neuroticism,
        };
      } catch {
        return defaultScores;
      }
    }
    return defaultScores;
  }, [params.scores]);

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#56CCF2', '#2F80ED', '#005FCC']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Financial Personality</Text>
        <Text style={styles.subtitle}>
          Here's how your psychology shapes your money decisions
        </Text>

        {/* Trait cards */}
        <View style={styles.traitsContainer}>
          {Object.entries(scores).map(([trait, score]) => {
            const isExpanded = expandedTrait === trait;
            const colors = traitColors[trait];
            const desc = traitDescriptions[trait];
            const isHigh = score >= 50;

            return (
              <TouchableOpacity
                key={trait}
                style={styles.traitCard}
                onPress={() => setExpandedTrait(isExpanded ? null : trait)}
                activeOpacity={0.8}
              >
                <View style={styles.traitHeader}>
                  <Text style={styles.traitName}>{trait}</Text>
                  <Text style={styles.traitScore}>{score}%</Text>
                </View>

                {/* Score bar */}
                <View style={styles.scoreTrack}>
                  <LinearGradient
                    colors={[colors.from, colors.to]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.scoreFill, { width: `${score}%` }]}
                  />
                </View>

                {/* Expanded description */}
                {isExpanded && (
                  <View style={styles.traitExpanded}>
                    <Text style={styles.traitDescription}>
                      {isHigh ? desc.high : desc.low}
                    </Text>
                    <View style={styles.tipContainer}>
                      <Text style={styles.tipLabel}>💡 Tip</Text>
                      <Text style={styles.tipText}>{desc.tip}</Text>
                    </View>
                  </View>
                )}

                <Text style={styles.expandHint}>
                  {isExpanded ? 'Tap to collapse' : 'Tap for insights'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to App</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24,
  },
  traitsContainer: {
    gap: 12,
  },
  traitCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 16,
  },
  traitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  traitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  traitScore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F80ED',
  },
  scoreTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  traitExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  traitDescription: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 12,
  },
  tipContainer: {
    backgroundColor: 'rgba(47, 128, 237, 0.08)',
    borderRadius: 12,
    padding: 12,
  },
  tipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2F80ED',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
  },
  expandHint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  continueButton: {
    marginTop: 24,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2F80ED',
  },
});
