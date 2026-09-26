import React, { useState, useMemo } from 'react';
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
import { useUser } from '../contexts/UserContext';
import { buildOceanTraits } from '../lib/traits';
import { useTheme, type Theme } from '../contexts/ThemeContext';

// Default/fallback scores
const defaultScores = {
  Openness: 72,
  Conscientiousness: 58,
  Extraversion: 65,
  Agreeableness: 71,
  Neuroticism: 38,
};

export default function ResultsScreen() {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ scores?: string }>();
  const { completeOnboarding } = useUser();
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

  const traits = useMemo(() => buildOceanTraits(scores), [scores]);

  const handleContinue = async () => {
    await completeOnboarding();
    router.replace('/(tabs)/faith');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={t.gradients.main}
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

        {/* Trait cards -- same content as the profile screen, built from the
            same shared helper so the two cannot drift apart again. */}
        <View style={styles.traitsContainer}>
          {traits.map((trait) => {
            const isExpanded = expandedTrait === trait.trait;
            const colors = t.traitGradients[trait.trait];

            return (
              <TouchableOpacity
                key={trait.trait}
                style={styles.traitCard}
                onPress={() => setExpandedTrait(isExpanded ? null : trait.trait)}
                activeOpacity={0.8}
              >
                <View style={styles.traitHeader}>
                  <View style={styles.traitLabelRow}>
                    <LinearGradient
                      colors={[colors.from, colors.to]}
                      style={styles.traitBadge}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.traitLetter}>{trait.letter}</Text>
                    </LinearGradient>
                    <Text style={styles.traitName}>{trait.trait}</Text>
                  </View>
                  <Text style={styles.traitScore}>{trait.score}</Text>
                </View>

                {/* Score bar */}
                <View style={styles.scoreTrack}>
                  <LinearGradient
                    colors={[colors.from, colors.to]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.scoreFill, { width: `${trait.score}%` }]}
                  />
                </View>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.expandedSection}>
                      <Text style={styles.expandedSectionTitle}>{trait.trait} — {trait.score}/100</Text>
                      <Text style={styles.expandedText}>{trait.definition}</Text>
                    </View>
                    <View style={styles.expandedSection}>
                      {trait.subtraits.map((s) => (
                        <View key={s.name} style={styles.subtraitRow}>
                          <View style={[styles.subtraitDot, { backgroundColor: colors.from }]} />
                          <Text style={styles.expandedText}>
                            <Text style={styles.boldText}>{s.name}</Text> — {s.insight}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.expandedSection}>
                      <Text style={styles.expandedSectionTitle}>Your Profile</Text>
                      <Text style={styles.expandedText}>{trait.profile}</Text>
                    </View>
                    <View style={styles.expandedFaith}>
                      <Text style={styles.faithHelpText}>
                        <Text style={styles.boldText}>How Faith Can Help</Text> — {trait.faith}
                      </Text>
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
          <Text style={styles.continueButtonText}>Continue to Faith</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  traitLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  traitBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  traitLetter: {
    fontSize: t.type.bodySmall,
    fontWeight: '700',
    color: t.textPrimary,
  },
  expandedContent: {
    marginTop: 12,
    backgroundColor: t.surfaceNeutralAlt,
    borderRadius: 12,
    overflow: 'hidden',
  },
  expandedSection: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.textMuted,
  },
  expandedSectionTitle: {
    fontSize: t.type.caption,
    fontWeight: '600',
    color: t.textOnSurface,
    marginBottom: 4,
  },
  expandedText: {
    fontSize: t.type.caption,
    color: t.textOnSurfaceSecondary,
    lineHeight: t.line.compact,
  },
  subtraitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  subtraitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  boldText: {
    fontWeight: '700',
  },
  expandedFaith: {
    padding: 12,
    backgroundColor: t.primaryTintFaint,
  },
  faithHelpText: {
    fontSize: t.type.caption,
    color: t.primaryOnSurface,
  },
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
    fontSize: t.type.headline,
    fontWeight: '700',
    color: t.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: t.type.body,
    color: t.textMuted,
    marginBottom: 24,
  },
  traitsContainer: {
    gap: 12,
  },
  traitCard: {
    backgroundColor: t.surfaceCard,
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
    fontSize: t.type.bodyLarge,
    fontWeight: '600',
    color: t.textOnSurface,
  },
  traitScore: {
    fontSize: t.type.labelLarge,
    fontWeight: '700',
    color: t.secondary,
  },
  scoreTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: t.shadowSoftAlt,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  expandHint: {
    fontSize: t.type.captionSmall,
    color: t.textOnSurfaceSubtle,
    textAlign: 'center',
    marginTop: 8,
  },
  continueButton: {
    marginTop: 24,
    height: 50,
    backgroundColor: t.textPrimary,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: t.shadowBase,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: t.type.body,
    fontWeight: '600',
    color: t.secondary,
  },
});
