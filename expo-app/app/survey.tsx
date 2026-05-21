import React, { useState, useRef } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const questions = [
  { id: 1, text: "A friend invites you on a spontaneous weekend trip abroad.", hint: "How do you respond?", options: ["Book it immediately — life's too short!", "Check your budget first, then decide", "Politely decline — you prefer planned holidays", "Hard no — spontaneous spending stresses you out"] },
  { id: 2, text: "Your favourite brand drops a new limited-edition product.", hint: "What's your move?", options: ["Buy it straight away before it sells out", "Add it to your wishlist and sleep on it", "Wait for reviews and maybe a sale", "Ignore it — you stick with what you know"] },
  { id: 3, text: "A colleague suggests investing in crypto.", hint: "How do you react?", options: ["Exciting! You research it that evening", "Interesting — you'd consider a small amount", "Too risky — you prefer traditional savings", "No chance — you avoid anything speculative"] },
  { id: 4, text: "It's payday. What happens first?", hint: "Be honest!", options: ["Treat yourself — you've earned it", "Move savings first, then spend freely", "Check your bills, then allocate the rest", "Nothing changes — you budget monthly anyway"] },
  { id: 5, text: "You notice an unused subscription on your bank statement.", hint: "What do you do?", options: ["Ignore it — it's only a few quid", "Cancel it immediately", "Keep meaning to cancel, but forget", "Keep it 'just in case'"] },
  { id: 6, text: "You want to save for a holiday in three months.", hint: "How do you approach it?", options: ["Set up automatic transfers right now", "Try to save, but dip into it sometimes", "Plan to save, but rarely follow through", "Wing it — you'll figure it out closer to the time"] },
  { id: 7, text: "Your group chat lights up with Friday night plans.", hint: "What's your typical response?", options: ["You're in — already suggesting venues", "Sounds fun, but you check your budget first", "You'd rather a quiet night with close friends", "Pass — you prefer staying in"] },
  { id: 8, text: "Do you spend more when shopping alone or with friends?", hint: "Think about your recent purchases.", options: ["Way more with friends — it's part of the fun", "Slightly less alone — no peer pressure", "About the same either way", "Much less alone — friends encourage impulse buys"] },
  { id: 9, text: "You get a surprise pay rise.", hint: "Who finds out?", options: ["Everyone — you celebrate loudly", "Close friends and family", "Just your partner or best mate", "No one — money is private"] },
  { id: 10, text: "A flatmate asks to borrow money until payday.", hint: "What do you do?", options: ["Of course — you'd do anything to help", "Yes, but you set a clear repayment date", "Maybe a small amount, reluctantly", "No — lending money ruins friendships"] },
  { id: 11, text: "At a group dinner, someone orders way more than you.", hint: "The bill arrives to split evenly.", options: ["Pay your share to avoid awkwardness", "Suggest splitting, but back down if pushed", "Offer to split by what each person ordered", "Insist on paying only for what you had"] },
  { id: 12, text: "A charity worker approaches you on the street.", hint: "How do you typically respond?", options: ["Sign up — it's hard to say no to a good cause", "Politely listen, then decide", "Keep walking — you give in your own time", "Firmly decline — you dislike pressure tactics"] },
  { id: 13, text: "You check your bank balance and it's lower than expected.", hint: "How do you feel?", options: ["Panicked — where did it all go?", "Worried — you need to review your spending", "Mildly concerned, but you'll sort it", "Unfazed — these things happen"] },
  { id: 14, text: "After an impulse purchase, how long does the guilt last?", hint: "Be honest with yourself.", options: ["Days — you replay the decision constantly", "A few hours of second-guessing", "A brief pang, then you move on", "No guilt — you trust your choices"] },
  { id: 15, text: "How often do you compare your finances to friends or colleagues?", hint: "Social media counts too.", options: ["Constantly — it affects your mood", "Occasionally, and it stresses you out", "Sometimes, but it doesn't bother you much", "Rarely — you focus on your own journey"] },
];

export default function SurveyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userName?: string }>();
  const insets = useSafeAreaInsets();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const slideAnim = useRef(new Animated.Value(0)).current;

  const question = questions[currentQuestion];
  const progress = (currentQuestion + 1) / questions.length;

  const handleAnswer = (optionIndex: number) => {
    setAnswers({ ...answers, [question.id]: optionIndex });

    if (currentQuestion < questions.length - 1) {
      // Animate to next question
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -SCREEN_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_WIDTH,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 200);
    } else {
      // All questions answered - convert to letter format and go to processing
      const answerLetters = questions.map((q) => {
        const idx = answers[q.id] ?? 0;
        return ['A', 'B', 'C', 'D'][idx];
      });
      // Include the current answer
      answerLetters[question.id - 1] = ['A', 'B', 'C', 'D'][optionIndex];
      router.push({ pathname: '/processing', params: { answers: JSON.stringify(answerLetters), userName: params.userName } });
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#56CCF2', '#2F80ED', '#005FCC']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Progress bars */}
      <View style={[styles.progressContainer, { top: insets.top + 54 }]}>
        {questions.map((_, idx) => (
          <View key={idx} style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: idx < currentQuestion ? '100%' : idx === currentQuestion ? '50%' : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 74 }]}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <Animated.View style={[styles.questionContainer, { transform: [{ translateX: slideAnim }] }]}>
          <Text style={styles.questionNumber}>{question.id} of 15</Text>
          <Text style={styles.questionText}>{question.text}</Text>
          <Text style={styles.questionHint}>{question.hint}</Text>

          {/* Answer options */}
          <View style={styles.optionsContainer}>
            {question.options.map((option, idx) => {
              const isSelected = answers[question.id] === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                  onPress={() => handleAnswer(idx)}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
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
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  questionHint: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#fff',
    borderColor: '#2F80ED',
  },
  optionText: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#2F80ED',
  },
});
