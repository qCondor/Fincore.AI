import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { WaveBackground } from '../components/WaveBackground';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme, type Theme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Question {
  itemId: number;
  domain: string;
  facet: string;
  reverse: boolean;
  text: string;
}

const questions: Question[] = [
  // Extraversion — Sociability
  { itemId: 1,  domain: 'extraversion', facet: 'sociability',         reverse: false, text: 'Is outgoing, sociable.' },
  { itemId: 46, domain: 'extraversion', facet: 'sociability',         reverse: false, text: 'Is talkative.' },
  { itemId: 16, domain: 'extraversion', facet: 'sociability',         reverse: true,  text: 'Tends to be quiet.' },
  { itemId: 31, domain: 'extraversion', facet: 'sociability',         reverse: true,  text: 'Is sometimes shy, introverted.' },
  // Extraversion — Assertiveness
  { itemId: 6,  domain: 'extraversion', facet: 'assertiveness',       reverse: false, text: 'Has an assertive personality.' },
  { itemId: 21, domain: 'extraversion', facet: 'assertiveness',       reverse: false, text: 'Is dominant, acts as a leader.' },
  { itemId: 36, domain: 'extraversion', facet: 'assertiveness',       reverse: true,  text: 'Finds it hard to influence people.' },
  { itemId: 51, domain: 'extraversion', facet: 'assertiveness',       reverse: true,  text: 'Prefers to have others take charge.' },
  // Extraversion — Energy Level
  { itemId: 41, domain: 'extraversion', facet: 'energyLevel',         reverse: false, text: 'Is full of energy.' },
  { itemId: 56, domain: 'extraversion', facet: 'energyLevel',         reverse: false, text: 'Shows a lot of enthusiasm.' },
  { itemId: 11, domain: 'extraversion', facet: 'energyLevel',         reverse: true,  text: 'Rarely feels excited or eager.' },
  { itemId: 26, domain: 'extraversion', facet: 'energyLevel',         reverse: true,  text: 'Is less active than other people.' },
  // Agreeableness — Compassion
  { itemId: 2,  domain: 'agreeableness', facet: 'compassion',         reverse: false, text: 'Is compassionate, has a soft heart.' },
  { itemId: 32, domain: 'agreeableness', facet: 'compassion',         reverse: false, text: 'Is helpful and unselfish with others.' },
  { itemId: 17, domain: 'agreeableness', facet: 'compassion',         reverse: true,  text: 'Feels little sympathy for others.' },
  { itemId: 47, domain: 'agreeableness', facet: 'compassion',         reverse: true,  text: 'Can be cold and uncaring.' },
  // Agreeableness — Respectfulness
  { itemId: 7,  domain: 'agreeableness', facet: 'respectfulness',     reverse: false, text: 'Is respectful, treats others with respect.' },
  { itemId: 52, domain: 'agreeableness', facet: 'respectfulness',     reverse: false, text: 'Is polite, courteous to others.' },
  { itemId: 22, domain: 'agreeableness', facet: 'respectfulness',     reverse: true,  text: 'Starts arguments with others.' },
  { itemId: 37, domain: 'agreeableness', facet: 'respectfulness',     reverse: true,  text: 'Is sometimes rude to others.' },
  // Agreeableness — Trust
  { itemId: 27, domain: 'agreeableness', facet: 'trust',              reverse: false, text: 'Has a forgiving nature.' },
  { itemId: 57, domain: 'agreeableness', facet: 'trust',              reverse: false, text: 'Assumes the best about people.' },
  { itemId: 12, domain: 'agreeableness', facet: 'trust',              reverse: true,  text: 'Tends to find fault with others.' },
  { itemId: 42, domain: 'agreeableness', facet: 'trust',              reverse: true,  text: "Is suspicious of others' intentions." },
  // Conscientiousness — Organization
  { itemId: 18, domain: 'conscientiousness', facet: 'organization',   reverse: false, text: 'Is systematic, likes to keep things in order.' },
  { itemId: 33, domain: 'conscientiousness', facet: 'organization',   reverse: false, text: 'Keeps things neat and tidy.' },
  { itemId: 3,  domain: 'conscientiousness', facet: 'organization',   reverse: true,  text: 'Tends to be disorganized.' },
  { itemId: 48, domain: 'conscientiousness', facet: 'organization',   reverse: true,  text: "Leaves a mess, doesn't clean up." },
  // Conscientiousness — Productiveness
  { itemId: 38, domain: 'conscientiousness', facet: 'productiveness', reverse: false, text: 'Is efficient, gets things done.' },
  { itemId: 53, domain: 'conscientiousness', facet: 'productiveness', reverse: false, text: 'Is persistent, works until the task is finished.' },
  { itemId: 8,  domain: 'conscientiousness', facet: 'productiveness', reverse: true,  text: 'Tends to be lazy.' },
  { itemId: 23, domain: 'conscientiousness', facet: 'productiveness', reverse: true,  text: 'Has difficulty getting started on tasks.' },
  // Conscientiousness — Responsibility
  { itemId: 13, domain: 'conscientiousness', facet: 'responsibility', reverse: false, text: 'Is dependable, steady.' },
  { itemId: 43, domain: 'conscientiousness', facet: 'responsibility', reverse: false, text: 'Is reliable, can always be counted on.' },
  { itemId: 28, domain: 'conscientiousness', facet: 'responsibility', reverse: true,  text: 'Can be somewhat careless.' },
  { itemId: 58, domain: 'conscientiousness', facet: 'responsibility', reverse: true,  text: 'Sometimes behaves irresponsibly.' },
  // Negative Emotionality — Anxiety
  { itemId: 19, domain: 'negativeEmotionality', facet: 'anxiety',              reverse: false, text: 'Can be tense.' },
  { itemId: 34, domain: 'negativeEmotionality', facet: 'anxiety',              reverse: false, text: 'Worries a lot.' },
  { itemId: 4,  domain: 'negativeEmotionality', facet: 'anxiety',              reverse: true,  text: 'Is relaxed, handles stress well.' },
  { itemId: 49, domain: 'negativeEmotionality', facet: 'anxiety',              reverse: true,  text: 'Rarely feels anxious or afraid.' },
  // Negative Emotionality — Depression
  { itemId: 39, domain: 'negativeEmotionality', facet: 'depression',           reverse: false, text: 'Often feels sad.' },
  { itemId: 54, domain: 'negativeEmotionality', facet: 'depression',           reverse: false, text: 'Tends to feel depressed, blue.' },
  { itemId: 9,  domain: 'negativeEmotionality', facet: 'depression',           reverse: true,  text: 'Stays optimistic after experiencing a setback.' },
  { itemId: 24, domain: 'negativeEmotionality', facet: 'depression',           reverse: true,  text: 'Feels secure, comfortable with self.' },
  // Negative Emotionality — Emotional Volatility
  { itemId: 14, domain: 'negativeEmotionality', facet: 'emotionalVolatility',  reverse: false, text: 'Is moody, has up and down mood swings.' },
  { itemId: 59, domain: 'negativeEmotionality', facet: 'emotionalVolatility',  reverse: false, text: 'Is temperamental, gets emotional easily.' },
  { itemId: 29, domain: 'negativeEmotionality', facet: 'emotionalVolatility',  reverse: true,  text: 'Is emotionally stable, not easily upset.' },
  { itemId: 44, domain: 'negativeEmotionality', facet: 'emotionalVolatility',  reverse: true,  text: 'Keeps their emotions under control.' },
  // Open-Mindedness — Intellectual Curiosity
  { itemId: 10, domain: 'openMindedness', facet: 'intellectualCuriosity', reverse: false, text: 'Is curious about many different things.' },
  { itemId: 40, domain: 'openMindedness', facet: 'intellectualCuriosity', reverse: false, text: 'Is complex, a deep thinker.' },
  { itemId: 25, domain: 'openMindedness', facet: 'intellectualCuriosity', reverse: true,  text: 'Avoids intellectual, philosophical discussions.' },
  { itemId: 55, domain: 'openMindedness', facet: 'intellectualCuriosity', reverse: true,  text: 'Has little interest in abstract ideas.' },
  // Open-Mindedness — Aesthetic Sensitivity
  { itemId: 20, domain: 'openMindedness', facet: 'aestheticSensitivity', reverse: false, text: 'Is fascinated by art, music, or literature.' },
  { itemId: 35, domain: 'openMindedness', facet: 'aestheticSensitivity', reverse: false, text: 'Values art and beauty.' },
  { itemId: 5,  domain: 'openMindedness', facet: 'aestheticSensitivity', reverse: true,  text: 'Has few artistic interests.' },
  { itemId: 50, domain: 'openMindedness', facet: 'aestheticSensitivity', reverse: true,  text: 'Thinks poetry and plays are boring.' },
  // Open-Mindedness — Creative Imagination
  { itemId: 15, domain: 'openMindedness', facet: 'creativeImagination', reverse: false, text: 'Is inventive, finds clever ways to do things.' },
  { itemId: 60, domain: 'openMindedness', facet: 'creativeImagination', reverse: false, text: 'Is original, comes up with new ideas.' },
  { itemId: 30, domain: 'openMindedness', facet: 'creativeImagination', reverse: true,  text: 'Has little creativity.' },
  { itemId: 45, domain: 'openMindedness', facet: 'creativeImagination', reverse: true,  text: 'Has difficulty imagining things.' },
];

const LIKERT_OPTIONS = [
  { label: 'Strongly Disagree', value: 1 },
  { label: 'Disagree',          value: 2 },
  { label: 'Neutral',           value: 3 },
  { label: 'Agree',             value: 4 },
  { label: 'Strongly Agree',    value: 5 },
];

const QUESTIONS_PER_PAGE = 4;
const TOTAL_PAGES = Math.ceil(questions.length / QUESTIONS_PER_PAGE);

// Each BFI-2 facet has exactly 4 items, so a page is always one facet. Keyed by
// facet rather than page index so the heading cannot drift from the statements
// shown if the question order is ever changed.
const FACET_LABELS: Record<string, string> = {
  sociability: 'Sociability',
  assertiveness: 'Assertiveness',
  energyLevel: 'Energy Level',
  compassion: 'Compassion',
  respectfulness: 'Respectfulness',
  trust: 'Trust',
  organization: 'Organization',
  productiveness: 'Productiveness',
  responsibility: 'Responsibility',
  anxiety: 'Anxiety',
  depression: 'Depression',
  emotionalVolatility: 'Emotional Volatility',
  intellectualCuriosity: 'Intellectual Curiosity',
  aestheticSensitivity: 'Aesthetic Sensitivity',
  creativeImagination: 'Creative Imagination',
};

export default function SurveyScreen() {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const router = useRouter();
  const params = useLocalSearchParams<{ userName?: string }>();
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  // True while the slide-out/slide-in transition is running, so a double tap
  // on Continue cannot advance two pages or index past the last one.
  const isAdvancing = useRef(false);

  const lastPage = TOTAL_PAGES - 1;
  const pageIndex = Math.min(currentPage, lastPage);
  const pageStart = pageIndex * QUESTIONS_PER_PAGE;
  const pageQuestions = questions.slice(pageStart, pageStart + QUESTIONS_PER_PAGE);
  const pageTitle = FACET_LABELS[pageQuestions[0]?.facet] ?? '';
  const answeredCount = Object.keys(answers).length;
  const progress = answeredCount / questions.length;
  const isPageComplete = pageQuestions.every((_, i) => answers[pageStart + i] !== undefined);

  const handleAnswer = (questionIndex: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: value }));
  };

  const submit = () => {
    const payload = questions.map((q, idx) => ({
      itemId: q.itemId,
      facet: q.facet,
      domain: q.domain,
      reverse: q.reverse,
      rating: answers[idx] ?? 3,
    }));
    router.push({
      pathname: '/processing',
      params: { answers: JSON.stringify(payload), userName: params.userName },
    });
  };

  const handleContinue = () => {
    if (isAdvancing.current || !isPageComplete) return;

    if (currentPage >= lastPage) {
      submit();
      return;
    }

    isAdvancing.current = true;
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      slideAnim.setValue(SCREEN_WIDTH);
      setCurrentPage(p => Math.min(p + 1, lastPage));
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        isAdvancing.current = false;
      });
    });
  };

  const handleBack = () => {
    slideAnim.stopAnimation();
    slideAnim.setValue(0);
    isAdvancing.current = false;
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <WaveBackground prefix="survey" />

      {/* Single continuous progress bar */}
      <View style={[styles.progressContainer, { top: insets.top + 54 }]}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 74 }]}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke={t.textPrimary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <Animated.View style={[styles.questionContainer, { transform: [{ translateX: slideAnim }] }]}>
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.questionNumber}>
              {pageIndex + 1}/{TOTAL_PAGES} sections
            </Text>
            <Text style={styles.sectionTitle}>{pageTitle}</Text>
            <Text style={styles.questionHint}>Rate how accurately each statement describes you.</Text>

            <View style={styles.scaleLegend}>
              <Text style={styles.scaleLegendText}>Strongly disagree</Text>
              <Text style={styles.scaleLegendText}>Strongly agree</Text>
            </View>

            {pageQuestions.map((q, i) => {
              const questionIndex = pageStart + i;
              const selected = answers[questionIndex];
              return (
                <View key={q.itemId} style={styles.questionBlock}>
                  <Text style={styles.questionText}>{q.text}</Text>
                  <View style={styles.scaleRow}>
                    {LIKERT_OPTIONS.map((option) => {
                      const isSelected = selected === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.scaleDot, isSelected && styles.scaleDotSelected]}
                          onPress={() => handleAnswer(questionIndex, option.value)}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: isSelected }}
                          accessibilityLabel={`${q.text} — ${option.label}`}
                        >
                          <Text style={[styles.scaleDotText, isSelected && styles.scaleDotTextSelected]}>
                            {option.value}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity
              style={[styles.continueButton, !isPageComplete && styles.continueButtonDisabled]}
              onPress={handleContinue}
              disabled={!isPageComplete}
              activeOpacity={0.9}
            >
              <Text style={[styles.continueButtonText, !isPageComplete && styles.continueButtonTextDisabled]}>
                {currentPage >= lastPage ? 'Finish' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.background,
  },
  progressContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: t.overlayMedium,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: t.textPrimary,
    borderRadius: 1.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  questionContainer: {
    flex: 1,
  },
  questionNumber: {
    fontSize: t.type.caption,
    fontWeight: '600',
    color: t.textFaint,
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 16,
  },
  questionText: {
    fontSize: t.type.bodyLarge,
    fontWeight: '600',
    color: t.textPrimary,
    lineHeight: t.line.body,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: t.type.title,
    fontWeight: '700',
    color: t.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  questionHint: {
    fontSize: t.type.bodySmall,
    color: t.textFaint,
    marginBottom: 20,
  },
  scaleLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scaleLegendText: {
    fontSize: t.type.captionSmall,
    color: t.textFaint,
  },
  questionBlock: {
    marginBottom: 24,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleDot: {
    flex: 1,
    marginHorizontal: 4,
    height: 48,
    borderRadius: 14,
    backgroundColor: t.textNear,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scaleDotSelected: {
    backgroundColor: t.textPrimary,
    borderColor: t.secondary,
  },
  scaleDotText: {
    fontSize: t.type.body,
    fontWeight: '600',
    color: t.textOnSurface,
  },
  scaleDotTextSelected: {
    color: t.secondary,
  },
  footer: {
    paddingTop: 8,
  },
  continueButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: t.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: t.overlayMedium,
  },
  continueButtonText: {
    fontSize: t.type.bodyLarge,
    fontWeight: '600',
    color: t.textOnSurface,
  },
  continueButtonTextDisabled: {
    color: t.textFaint,
  },
});
