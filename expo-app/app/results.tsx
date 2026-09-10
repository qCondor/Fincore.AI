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
import { traitMetadata } from '../lib/traits';
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

        {/* Trait cards */}
        <View style={styles.traitsContainer}>
          {Object.entries(scores).map(([trait, score]) => {
            const isExpanded = expandedTrait === trait;
            const colors = t.traitGradients[trait];
            const meta = traitMetadata[trait.toLowerCase()];
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
                {isExpanded && meta && (
                  <View style={styles.traitExpanded}>
                    <Text style={styles.traitDescription}>
                      {isHigh ? meta.highProfile : meta.lowProfile}
                    </Text>
                    <View style={styles.tipContainer}>
                      <Text style={styles.tipLabel}>💡 Tip</Text>
                      <Text style={styles.tipText}>{meta.tip}</Text>
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
  traitExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: t.shadowSoft,
  },
  traitDescription: {
    fontSize: t.type.bodyCompact,
    color: t.textOnLightBody,
    lineHeight: t.line.body,
    marginBottom: 12,
  },
  tipContainer: {
    backgroundColor: t.secondaryTint,
    borderRadius: 12,
    padding: 12,
  },
  tipLabel: {
    fontSize: t.type.caption,
    fontWeight: '600',
    color: t.secondary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: t.type.bodySmall,
    color: t.textOnLightBody,
    lineHeight: t.line.compact,
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
