import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function SurveyScreen() {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const router = useRouter();
  const params = useLocalSearchParams<{ userName?: string }>();
  const insets = useSafeAreaInsets();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const slideAnim = useRef(new Animated.Value(0)).current;
  // True while the slide-out/slide-in transition is running. A second tap in
  // that window used to queue a second `q => q + 1`, skipping a question and,
  // on the penultimate question, indexing past the end of `questions`.
  const isAdvancing = useRef(false);

  const lastIndex = questions.length - 1;
  // Defensive clamp: `questions` is static so this only matters if state is
  // ever pushed out of range, but it guarantees `question` is always defined.
  const question = questions[Math.min(currentQuestion, lastIndex)];
  const progress = currentQuestion / questions.length;

  const handleAnswer = (value: number) => {
    if (isAdvancing.current) return;

    const newAnswers = { ...answers, [currentQuestion]: value };
    setAnswers(newAnswers);

    if (currentQuestion < lastIndex) {
      isAdvancing.current = true;
      Animated.timing(slideAnim, {
        toValue: -SCREEN_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        slideAnim.setValue(SCREEN_WIDTH);
        setCurrentQuestion(q => Math.min(q + 1, lastIndex));
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          isAdvancing.current = false;
        });
      });
    } else {
      const payload = questions.map((q, idx) => ({
        itemId: q.itemId,
        facet: q.facet,
        domain: q.domain,
        reverse: q.reverse,
        rating: newAnswers[idx] ?? 3,
      }));
      router.push({
        pathname: '/processing',
        params: { answers: JSON.stringify(payload), userName: params.userName },
      });
    }
  };

  const handleBack = () => {
    slideAnim.stopAnimation();
    slideAnim.setValue(0);
    isAdvancing.current = false;
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={t.gradients.main}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

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
          <Text style={styles.questionNumber}>{currentQuestion + 1} of {questions.length}</Text>
          <Text style={styles.questionText}>{question.text}</Text>
          <Text style={styles.questionHint}>Rate how accurately this describes you.</Text>

          {/* Likert scale options */}
          <View style={styles.optionsContainer}>
            {LIKERT_OPTIONS.map((option) => {
              const isSelected = answers[currentQuestion] === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                  onPress={() => handleAnswer(option.value)}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  container: {
    flex: 1,
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
  questionText: {
    fontSize: t.type.headline,
    fontWeight: '700',
    color: t.textPrimary,
    lineHeight: t.line.display,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  questionHint: {
    fontSize: t.type.body,
    color: t.textFaint,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: t.textNear,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: t.textPrimary,
    borderColor: t.secondary,
  },
  optionText: {
    fontSize: t.type.body,
    color: t.textOnSurface,
    lineHeight: t.line.body,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: t.secondary,
  },
});
