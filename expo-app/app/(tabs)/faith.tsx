import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Defs, LinearGradient as SvgLinearGradient, Stop, ClipPath, Rect, G } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ComingSoonModal } from '../../components/ComingSoonModal';
import { HistoryDrawer } from '../../components/HistoryDrawer';
import { useChat } from '../../hooks/useChat';
import { useProfile } from '../../hooks/useProfile';
import { useUser } from '../../contexts/UserContext';
import type { ChatSession } from '../../hooks/useChatHistory';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function WaveBackground() {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const wave1Anim = React.useRef(new Animated.Value(0)).current;
  const wave2Anim = React.useRef(new Animated.Value(0)).current;
  const wave3Anim = React.useRef(new Animated.Value(0)).current;
  const wave4Anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const createWaveAnimation = (anim: Animated.Value, duration: number, delay: number) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: duration / 2, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: duration / 2, useNativeDriver: true }),
          ])
        ).start();
      }, delay);
    };

    createWaveAnimation(wave1Anim, 6000, 0);
    createWaveAnimation(wave2Anim, 7000, 500);
    createWaveAnimation(wave3Anim, 8000, 1000);
    createWaveAnimation(wave4Anim, 5000, 1500);
  }, []);

  const wave1Style = {
    transform: [
      { translateY: wave1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
    ],
  };

  const wave2Style = {
    transform: [
      { translateY: wave2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) },
    ],
  };

  const wave3Style = {
    transform: [
      { translateY: wave3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) },
    ],
  };

  const wave4Style = {
    transform: [
      { translateY: wave4Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
    ],
  };

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 393 852"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <SvgLinearGradient id="base-gradient-faith" x1="0" y1="0.5" x2="1" y2="0.5">
            <Stop offset="0%" stopColor="#3CB8F0" />
            <Stop offset="50%" stopColor="#0A6FE8" />
            <Stop offset="100%" stopColor="#0035A0" />
          </SvgLinearGradient>
        </Defs>
        <Path d="M0,0 L393,0 L393,852 L0,852 Z" fill="url(#base-gradient-faith)" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave1Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id="clip-faith-1">
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <SvgLinearGradient id="wave1-anim-faith" x1="0.8" y1="0" x2="0.2" y2="1">
              <Stop offset="0%" stopColor="#A8EAFF" stopOpacity={0.55} />
              <Stop offset="45%" stopColor="#70D8FF" stopOpacity={0.35} />
              <Stop offset="100%" stopColor="#5ED4FF" stopOpacity={0.05} />
            </SvgLinearGradient>
          </Defs>
          <G clipPath="url(#clip-faith-1)">
            <Path d="M393,-50 C410,250 100,350 0,550 C-30,650 50,800 0,902 L393,902 Z" fill="url(#wave1-anim-faith)" />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave2Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id="clip-faith-2">
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <SvgLinearGradient id="wave2-anim-faith" x1="0.7" y1="0" x2="0.3" y2="1">
              <Stop offset="0%" stopColor="#6DDDFF" stopOpacity={0.4} />
              <Stop offset="50%" stopColor="#44BBFF" stopOpacity={0.25} />
              <Stop offset="100%" stopColor="#1A90FF" stopOpacity={0.05} />
            </SvgLinearGradient>
          </Defs>
          <G clipPath="url(#clip-faith-2)">
            <Path d="M393,-150 C400,150 50,250 0,420 C-30,530 30,700 0,902 L393,902 Z" fill="url(#wave2-anim-faith)" />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave3Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id="clip-faith-3">
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <SvgLinearGradient id="wave3-anim-faith" x1="0.6" y1="0" x2="0.4" y2="1">
              <Stop offset="0%" stopColor="#50C8FF" stopOpacity={0.35} />
              <Stop offset="50%" stopColor="#2AA0F0" stopOpacity={0.2} />
              <Stop offset="100%" stopColor="#0A6FE8" stopOpacity={0.05} />
            </SvgLinearGradient>
          </Defs>
          <G clipPath="url(#clip-faith-3)">
            <Path d="M393,-250 C390,80 20,170 0,300 C-30,400 10,580 0,902 L393,902 Z" fill="url(#wave3-anim-faith)" />
          </G>
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, wave4Style]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 852" preserveAspectRatio="none">
          <Defs>
            <ClipPath id="clip-faith-4">
              <Rect x="0" y="0" width="393" height="852" />
            </ClipPath>
            <SvgLinearGradient id="wave4-anim-faith" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0%" stopColor="#1A5FAA" stopOpacity={0.4} />
              <Stop offset="50%" stopColor="#0D4080" stopOpacity={0.25} />
              <Stop offset="100%" stopColor="#003070" stopOpacity={0.05} />
            </SvgLinearGradient>
          </Defs>
          <G clipPath="url(#clip-faith-4)">
            <Path d="M393,400 C350,550 200,750 100,820 C50,860 0,840 0,902 L393,902 Z" fill="url(#wave4-anim-faith)" />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  insightCard?: {
    title: string;
    items: { label: string; amount: string; pct: number }[];
    total: string;
  };
}

function MenuIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round">
      <Line x1={4} y1={7} x2={20} y2={7} />
      <Line x1={4} y1={12} x2={20} y2={12} />
      <Line x1={4} y1={17} x2={20} y2={17} />
    </Svg>
  );
}

function MicIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
      <Path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <Path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="rgba(255,255,255,0.5)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function SendIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HomeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 22V12h6v10" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChartIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#005FCC" strokeWidth={2.5}>
      <Line x1={18} y1={20} x2={18} y2={10} />
      <Line x1={12} y1={20} x2={12} y2={4} />
      <Line x1={6} y1={20} x2={6} y2={14} />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
      <Line x1={12} y1={5} x2={12} y2={19} />
      <Line x1={5} y1={12} x2={19} y2={12} />
    </Svg>
  );
}

function SparklesIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

function BrainIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
      <Path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z" />
      <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </Svg>
  );
}

function MessageNavIcon({ active }: { active?: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : 'rgba(255,255,255,0.7)'} strokeWidth={2}>
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </Svg>
  );
}

function CameraNavIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" />
      <Path d="M12 17a4 4 0 100-8 4 4 0 000 8z" />
    </Svg>
  );
}

function LandmarkIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
      <Line x1={3} y1={22} x2={21} y2={22} />
      <Line x1={6} y1={18} x2={6} y2={11} />
      <Line x1={10} y1={18} x2={10} y2={11} />
      <Line x1={14} y1={18} x2={14} y2={11} />
      <Line x1={18} y1={18} x2={18} y2={11} />
      <Path d="M12 2L2 7h20L12 2z" />
    </Svg>
  );
}

function BarChartIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
      <Line x1={18} y1={20} x2={18} y2={10} />
      <Line x1={12} y1={20} x2={12} y2={4} />
      <Line x1={6} y1={20} x2={6} y2={14} />
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2}>
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

function TypingIndicator() {
  return (
    <View style={styles.typingContainer}>
      <View style={styles.faithAvatar}>
        <LinearGradient colors={['#00C2FF', '#005FCC']} style={styles.faithAvatarGradient}>
          <Text style={styles.faithAvatarText}>F</Text>
        </LinearGradient>
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.typingDot, { opacity: 0.45 + (i * 0.2) }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'Why do I spend so much on weekends?',
    time: '9:31 AM',
  },
  {
    id: '2',
    role: 'assistant',
    content: "Good morning! 👋\n\nBased on your high Extraversion score, I noticed you tend to spend more on social activities at weekends. Want me to help you set a social budget?",
    time: '9:32 AM',
  },
  {
    id: '3',
    role: 'user',
    content: "Yeah that would be great! How much am I actually spending?",
    time: '9:33 AM',
  },
  {
    id: '4',
    role: 'assistant',
    content: "Here's your social spending breakdown for March:",
    time: '9:33 AM',
    insightCard: {
      title: 'Social Spending — March',
      items: [
        { label: 'Dining out', amount: '£187', pct: 45 },
        { label: 'Drinks & bars', amount: '£124', pct: 30 },
        { label: 'Events & tickets', amount: '£68', pct: 16 },
        { label: 'Other social', amount: '£37', pct: 9 },
      ],
      total: '£416',
    },
  },
];

const defaultSuggestions = [
  "Why do I overspend at weekends?",
  "Help me build an emergency fund",
  "Should I invest or pay off debt?",
  "How can I stop impulse buying?",
];

interface ScanContext {
  scan_id?: string;
  product_name?: string;
  overall_score?: number;
  estimated_price?: number;
  verdict?: string;
  category?: string;
}

export default function FaithScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ scanContext?: string; profileQuestion?: string }>();
  const { userId } = useUser();
  const { initials } = useProfile({ userId: userId ?? undefined });
  const {
    messages: chatMessages,
    input: inputText,
    setInput: setInputText,
    isTyping,
    sendMessage,
    startNewSession,
    loadSession,
    isLoadingSession,
    suggestions: dynamicSuggestions,
  } = useChat({ userId: userId ?? undefined });

  // Use dynamic suggestions if available, otherwise defaults
  const quickReplies = dynamicSuggestions.length > 0 ? dynamicSuggestions : [];
  const [inputFocused, setInputFocused] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(false);
  const [comingSoonModal, setComingSoonModal] = useState<{ open: boolean; feature: 'banking' | 'analytics' | 'blueprint' | null }>({ open: false, feature: null });
  const scrollRef = useRef<ScrollView>(null);
  const navAnim = useRef(new Animated.Value(0)).current;
  const handledParamsRef = useRef<string | null>(null);

  // Handle initial context from scan or profile - start fresh session
  React.useEffect(() => {
    // Create a key from current params to detect new navigation
    const paramsKey = params.scanContext || params.profileQuestion || null;

    // Skip if no params or already handled this exact params
    if (!paramsKey || handledParamsRef.current === paramsKey) return;

    handledParamsRef.current = paramsKey;

    let contextMessage: string | null = null;

    // Check for scan context
    if (params.scanContext) {
      try {
        const scanContext: ScanContext = JSON.parse(params.scanContext);
        contextMessage = `I just scanned a product: ${scanContext.product_name || 'Unknown product'}. ` +
          (scanContext.overall_score ? `It scored ${scanContext.overall_score}/100. ` : '') +
          (scanContext.verdict ? `The verdict was: "${scanContext.verdict}". ` : '') +
          (scanContext.estimated_price ? `The price is £${scanContext.estimated_price.toFixed(2)}. ` : '') +
          `What do you think about this purchase?`;
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Check for profile question
    if (!contextMessage && params.profileQuestion) {
      contextMessage = params.profileQuestion;
    }

    if (contextMessage) {
      // Clear existing messages and start fresh, then send
      startNewSession();
      // Use a ref to track the message to send after session starts
      const messageToSend = contextMessage;
      setTimeout(() => {
        sendMessage(messageToSend);
      }, 50);
    }
  }, [params.scanContext, params.profileQuestion, startNewSession, sendMessage]);

  const messages: Message[] = chatMessages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    time: m.timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  }));

  const showEmpty = messages.length === 0 && !isTyping && !isLoadingSession;

  const toggleNav = (show: boolean, callback?: () => void) => {
    if (show) setNavVisible(true);
    Animated.timing(navAnim, {
      toValue: show ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      if (!show) setNavVisible(false);
      callback?.();
    });
  };

  const handleSuggestion = (text: string) => {
    sendMessage(text);
  };

  const handleNewChat = () => {
    startNewSession();
  };

  const handleSelectSession = (session: ChatSession) => {
    loadSession(session.session_id);
  };

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage();
    }
  };

  return (
    <View style={styles.container}>
      {/* Wave background */}
      <WaveBackground />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.menuButton} onPress={() => setHistoryDrawerOpen(true)}>
              <MenuIcon />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Faith</Text>
              <Text style={styles.headerSubtitle}>Your financial AI companion</Text>
            </View>
            <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
              <PlusIcon />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarButton}>
              <LinearGradient colors={['#005FCC', '#00C2FF']} style={styles.avatarGradient}>
                <View style={styles.avatarShine} />
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages or Empty State */}
        {isLoadingSession ? (
          <View style={styles.emptyState}>
            <View style={styles.loadingSpinner}>
              <Text style={styles.loadingText}>Loading conversation...</Text>
            </View>
          </View>
        ) : showEmpty ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyBadge}>
              <LinearGradient
                colors={['#00C2FF', '#005FCC', '#004AAD']}
                locations={[0, 0.6, 1]}
                style={styles.emptyBadgeGradient}
              >
                <SparklesIcon />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>Hi, I'm Faith</Text>
            <Text style={styles.emptySubtitle}>Your personality-aware financial coach</Text>
            <Text style={styles.suggestionLabel}>TRY ASKING</Text>
            <View style={styles.suggestionList}>
              {defaultSuggestions.map((s) => (
                <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => handleSuggestion(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          >
            {/* Date divider */}
            <View style={styles.dateDivider}>
              <View style={styles.datePill}>
                <Text style={styles.dateText}>Today</Text>
              </View>
            </View>

            {messages.map((msg) => (
              <View key={msg.id}>
                {msg.role === 'user' ? (
                  <View style={styles.userMessageContainer}>
                    <View style={styles.userBubble}>
                      <Text style={styles.userText}>{msg.content}</Text>
                    </View>
                    <Text style={styles.userTime}>{msg.time}</Text>
                  </View>
                ) : (
                  <View style={styles.assistantMessageContainer}>
                    <View style={styles.faithAvatar}>
                      <LinearGradient colors={['#00C2FF', '#005FCC']} style={styles.faithAvatarGradient}>
                        <Text style={styles.faithAvatarText}>F</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.assistantBubbleContainer}>
                      <View style={styles.assistantBubble}>
                        <Text style={styles.assistantText}>{msg.content}</Text>

                        {msg.insightCard && (
                          <View style={styles.insightCard}>
                            <View style={styles.insightHeader}>
                              <View style={styles.insightIconContainer}>
                                <ChartIcon />
                              </View>
                              <Text style={styles.insightTitle}>{msg.insightCard.title}</Text>
                            </View>
                            <View style={styles.insightItems}>
                              {msg.insightCard.items.map((item) => (
                                <View key={item.label} style={styles.insightItem}>
                                  <View style={styles.insightItemHeader}>
                                    <Text style={styles.insightItemLabel}>{item.label}</Text>
                                    <Text style={styles.insightItemAmount}>{item.amount}</Text>
                                  </View>
                                  <View style={styles.insightBarBg}>
                                    <LinearGradient
                                      colors={['#005FCC', '#00C2FF']}
                                      start={{ x: 0, y: 0 }}
                                      end={{ x: 1, y: 0 }}
                                      style={[styles.insightBar, { width: `${item.pct}%` }]}
                                    />
                                  </View>
                                </View>
                              ))}
                            </View>
                            <View style={styles.insightTotal}>
                              <Text style={styles.insightTotalLabel}>Total</Text>
                              <Text style={styles.insightTotalAmount}>{msg.insightCard.total}</Text>
                            </View>
                          </View>
                        )}

                        {msg.insightCard && (
                          <Text style={[styles.assistantText, { marginTop: 12 }]}>
                            That's <Text style={styles.boldText}>23% above</Text> your average. I'd suggest a weekly cap of £80. Shall I set that up?
                          </Text>
                        )}
                      </View>
                      <Text style={styles.assistantTime}>{msg.time}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}

            {/* Quick replies - dynamic based on Faith's response */}
            {messages.length > 0 && !isTyping && quickReplies.length > 0 && (
              <View style={styles.quickReplies}>
                {quickReplies.map((reply) => (
                  <TouchableOpacity key={reply} style={styles.quickReplyButton} onPress={() => sendMessage(reply)}>
                    <Text style={styles.quickReplyText}>{reply}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* Input bar with sliding navbar */}
        <View style={[styles.inputBarContainer, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.inputBarWrapper}>
            {/* Sliding navbar - only rendered when visible */}
            {navVisible && (
              <Animated.View
                style={[
                  styles.navBar,
                  {
                    transform: [{
                      translateX: navAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-SCREEN_WIDTH, 0],
                      }),
                    }],
                    opacity: navAnim,
                  },
                ]}
              >
                <TouchableOpacity style={styles.navItem} onPress={() => toggleNav(false, () => router.push('/profile'))}>
                  <BrainIcon />
                  <Text style={styles.navLabel}>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => toggleNav(false)}>
                  <MessageNavIcon active />
                  <Text style={[styles.navLabel, styles.navLabelActive]}>Faith</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => toggleNav(false, () => router.push('/'))}>
                  <CameraNavIcon />
                  <Text style={styles.navLabel}>Feels Like</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => toggleNav(false, () => setComingSoonModal({ open: true, feature: 'banking' }))}>
                  <LandmarkIcon />
                  <Text style={styles.navLabel}>Banking</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => toggleNav(false, () => setComingSoonModal({ open: true, feature: 'analytics' }))}>
                  <BarChartIcon />
                  <Text style={styles.navLabel}>Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navClose} onPress={() => toggleNav(false)}>
                  <ChevronRightIcon />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Input bar row */}
            <Animated.View
              style={[
                styles.inputBarRow,
                navVisible && {
                  opacity: navAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                  transform: [{
                    translateX: navAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, SCREEN_WIDTH],
                    }),
                  }],
                },
              ]}
            >
              {!inputFocused && (
                <TouchableOpacity style={styles.homeButton} onPress={() => toggleNav(true)}>
                  <HomeIcon />
                </TouchableOpacity>
              )}
              <View style={styles.inputBar}>
                {inputFocused && (
                  <TouchableOpacity style={styles.plusButton} onPress={() => setInputFocused(false)}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
                      <Path d="M12 5v14M5 12h14" />
                    </Svg>
                  </TouchableOpacity>
                )}
                {!inputFocused && <View style={{ width: 8 }} />}
                <TextInput
                  style={styles.textInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask Faith anything..."
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                />
                {!inputText.trim() && (
                  <TouchableOpacity style={styles.micButton}>
                    <MicIcon />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                  onPress={handleSend}
                  disabled={!inputText.trim()}
                >
                  <SendIcon />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ComingSoonModal
        visible={comingSoonModal.open}
        onClose={() => setComingSoonModal({ open: false, feature: null })}
        feature={comingSoonModal.feature === 'banking' ? 'Banking' : comingSoonModal.feature === 'analytics' ? 'Analytics' : 'Blueprint'}
        featureKey={comingSoonModal.feature || 'banking'}
        description={
          comingSoonModal.feature === 'banking'
            ? 'Connect your bank accounts and see all your transactions in one place, categorised by your spending personality.'
            : comingSoonModal.feature === 'analytics'
            ? 'Deep insights into your spending patterns, with personalised recommendations based on your OCEAN profile.'
            : 'See the full context behind your spending patterns and get a personalised action plan.'
        }
      />

      <HistoryDrawer
        visible={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        source="faith"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#005FCC',
    overflow: 'hidden',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  newChatButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  avatarShine: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 19,
    opacity: 0.3,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  emptyBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: 'rgba(0,95,204,0.35)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 32,
  },
  emptyBadgeGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  suggestionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 8,
  },
  suggestionList: {
    width: '100%',
    gap: 8,
  },
  suggestionChip: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  suggestionText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  loadingSpinner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 10,
  },
  typingBubble: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 16,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dateDivider: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  datePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userBubble: {
    maxWidth: '75%',
    backgroundColor: '#2F80ED',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: 'rgba(0,95,204,0.2)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  userText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  userTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
    marginRight: 8,
  },
  assistantMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 10,
  },
  faithAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  faithAvatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faithAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  assistantBubbleContainer: {
    maxWidth: '80%',
  },
  assistantBubble: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  assistantText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
  },
  assistantTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
    marginLeft: 8,
  },
  insightCard: {
    marginTop: 12,
    backgroundColor: 'rgba(0,95,204,0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,95,204,0.1)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  insightIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(0,95,204,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#005FCC',
  },
  insightItems: {
    gap: 8,
  },
  insightItem: {
    gap: 2,
  },
  insightItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  insightItemLabel: {
    fontSize: 12,
    color: '#666',
  },
  insightItemAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  insightBarBg: {
    height: 6,
    backgroundColor: 'rgba(0,95,204,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  insightBar: {
    height: '100%',
    borderRadius: 3,
  },
  insightTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,95,204,0.1)',
  },
  insightTotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  insightTotalAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#005FCC',
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 38,
    marginTop: 4,
  },
  quickReplyButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quickReplyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2F80ED',
  },
  inputBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputBarWrapper: {
    height: 50,
    position: 'relative',
  },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    zIndex: 20,
  },
  navItem: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  navClose: {
    position: 'absolute',
    right: 4,
    top: '50%',
    marginTop: -7,
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBarRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  homeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBar: {
    flex: 1,
    height: 50,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 6,
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  micButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#005FCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
