import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ComingSoonModal } from '../../components/ComingSoonModal';
import { HistoryDrawer } from '../../components/HistoryDrawer';
import { useChat } from '../../hooks/useChat';
import { useProfile } from '../../hooks/useProfile';
import { useUser } from '../../contexts/UserContext';
import type { ChatSession } from '../../hooks/useChatHistory';
import { MenuIcon, PlusIcon } from '../../components/icons';
import { WaveBackground } from '../../components/WaveBackground';
import { BottomInputBar } from '../../components/BottomInputBar';
import { AnimatedScreen } from '../../components/AnimatedScreen';

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

function ChartIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#005FCC" strokeWidth={2.5}>
      <Line x1={18} y1={20} x2={18} y2={10} />
      <Line x1={12} y1={20} x2={12} y2={4} />
      <Line x1={6} y1={20} x2={6} y2={14} />
    </Svg>
  );
}

function FaithSparklesIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
  const { initials, profile } = useProfile({ userId: userId ?? undefined });
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
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [comingSoonModal, setComingSoonModal] = useState<{ open: boolean; feature: 'banking' | 'analytics' | 'blueprint' | null }>({ open: false, feature: null });
  const scrollRef = useRef<ScrollView>(null);
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
    <AnimatedScreen style={styles.container}>
      {/* Wave background */}
      <WaveBackground prefix="faith" />

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
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={handleNewChat}
              accessibilityLabel="Start new chat"
              accessibilityHint="Clears the current conversation and starts fresh"
            >
              <PlusIcon />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarButton} onPress={() => router.push({ pathname: '/profile', params: { openSettings: 'true' } })}>
              {profile?.photo_url ? (
                <Image source={{ uri: profile.photo_url }} style={styles.avatarImage} />
              ) : (
                <LinearGradient colors={['#005FCC', '#00C2FF']} style={styles.avatarGradient}>
                  <View style={styles.avatarShine} />
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
              )}
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
                <FaithSparklesIcon />
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

        <BottomInputBar
          activeScreen="faith"
          placeholder="Ask Faith anything..."
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onMicPress={() => {
            // Voice input coming soon, but the affordance is now visible.
          }}
          showMic={true}
          onNavigate={(screen) => {
            if (screen === 'profile') router.push('/profile');
            else if (screen === 'scan') router.push('/');
          }}
          onComingSoon={(feature) => {
            if (feature === 'banking') router.push('/banking');
            else if (feature === 'analytics') router.push('/analytics');
            else setComingSoonModal({ open: true, feature });
          }}
          bottomInset={insets.bottom}
        />
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
    </AnimatedScreen>
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
  avatarImage: {
    width: '100%',
    height: '100%',
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
});
