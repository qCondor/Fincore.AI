import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Defs, LinearGradient as SvgLinearGradient, Stop, ClipPath, Rect, G } from 'react-native-svg';
import { useChatHistory, groupSessionsByDate, type ChatSession } from '../hooks/useChatHistory';
import { useScanHistory, groupScansByDate, type ScanRecord } from '../hooks/useScanHistory';
import { useUser } from '../contexts/UserContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HistoryDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelectSession: (session: ChatSession) => void;
  onSelectScan?: (scan: ScanRecord) => void;
  onNewChat: () => void;
  activeSessionId?: string;
  source: 'faith' | 'scan';
}

function XIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
      <Circle cx={11} cy={11} r={8} />
      <Line x1={21} y1={21} x2={16.65} y2={16.65} />
    </Svg>
  );
}

function ArrowLeftIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2} strokeLinecap="round">
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  );
}

function MessageIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </Svg>
  );
}

function CameraIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" />
      <Circle cx={12} cy={13} r={4} />
    </Svg>
  );
}

function EmptyMessageIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2}>
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </Svg>
  );
}

function WaveBackground() {
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
          <ClipPath id="clip-drawer">
            <Rect x="0" y="0" width="393" height="852" />
          </ClipPath>
          <SvgLinearGradient id="base-gradient-drawer" x1="0" y1="0.5" x2="1" y2="0.5">
            <Stop offset="0%" stopColor="#3CB8F0" />
            <Stop offset="50%" stopColor="#0A6FE8" />
            <Stop offset="100%" stopColor="#0035A0" />
          </SvgLinearGradient>
          <SvgLinearGradient id="wave1-gradient-drawer" x1="0.8" y1="0" x2="0.2" y2="1">
            <Stop offset="0%" stopColor="#A8EAFF" stopOpacity={0.55} />
            <Stop offset="45%" stopColor="#70D8FF" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#5ED4FF" stopOpacity={0.05} />
          </SvgLinearGradient>
        </Defs>
        <Path d="M0,0 L393,0 L393,852 L0,852 Z" fill="url(#base-gradient-drawer)" />
        <G clipPath="url(#clip-drawer)">
          <Path d="M393,-50 C410,250 100,350 0,550 C-30,650 50,800 0,902 L393,902 Z" fill="url(#wave1-gradient-drawer)" />
        </G>
      </Svg>
    </View>
  );
}

export function HistoryDrawer({
  visible,
  onClose,
  onSelectSession,
  onSelectScan,
  onNewChat,
  activeSessionId,
  source,
}: HistoryDrawerProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { userId } = useUser();

  const { sessions, loading: chatLoading, refresh: refreshChat } = useChatHistory({
    userId: userId ?? undefined,
    autoFetch: visible && source === 'faith',
  });

  const { scans, loading: scanLoading, refresh: refreshScans } = useScanHistory({
    userId: userId ?? undefined,
    autoFetch: visible && source === 'scan',
  });

  const loading = source === 'faith' ? chatLoading : scanLoading;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (visible) {
      if (source === 'faith') {
        refreshChat();
      } else {
        refreshScans();
      }
    }
  }, [visible, source]);

  const filteredSessions = searchQuery.trim()
    ? sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.first_message_preview.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sessions;

  const filteredScans = searchQuery.trim()
    ? scans.filter(
        (s) =>
          (s.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.category || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : scans;

  const groupedSessions = groupSessionsByDate(filteredSessions);
  const groupedScans = groupScansByDate(filteredScans);

  const handleSelectSession = (session: ChatSession) => {
    onSelectSession(session);
    onClose();
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleSelectScan = (scan: ScanRecord) => {
    onSelectScan?.(scan);
    onClose();
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX: slideAnim }] },
      ]}
    >
      <WaveBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {searchOpen ? (
          <View style={styles.searchBar}>
            <TouchableOpacity
              style={styles.searchBackButton}
              onPress={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
            >
              <ArrowLeftIcon />
            </TouchableOpacity>
            <TextInput
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholder="Search conversations..."
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
            {searchQuery !== '' && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <XIcon />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <XIcon />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => setSearchOpen(true)}
            >
              <SearchIcon />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          History — {source === 'faith' ? 'Faith' : 'Feels Like'}
        </Text>
      </View>

      {/* Sessions list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {source === 'faith' ? (
          loading ? (
            <View style={styles.loadingContainer}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonGroup}>
                  <View style={styles.skeletonLabel} />
                  <View style={styles.skeletonCard}>
                    {[1, 2, 3].map((j) => (
                      <View
                        key={j}
                        style={[
                          styles.skeletonItem,
                          j < 3 && styles.skeletonItemBorder,
                        ]}
                      >
                        <View style={styles.skeletonText} />
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : groupedSessions.length === 0 && searchQuery ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <SearchIcon />
              </View>
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>Try a different search term</Text>
            </View>
          ) : groupedSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <EmptyMessageIcon />
              </View>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>
                Start a new chat with Faith to see your history here
              </Text>
            </View>
          ) : (
            groupedSessions.map((group) => (
              <View key={group.label} style={styles.group}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                <View style={styles.groupCard}>
                  {group.items.map((session, i) => (
                    <TouchableOpacity
                      key={session.session_id}
                      style={[
                        styles.sessionItem,
                        i < group.items.length - 1 && styles.sessionItemBorder,
                        activeSessionId === session.session_id && styles.sessionItemActive,
                      ]}
                      onPress={() => handleSelectSession(session)}
                    >
                      <Text style={styles.sessionTitle} numberOfLines={1}>
                        {session.title || session.first_message_preview || 'Untitled conversation'}
                      </Text>
                      <Text style={styles.sessionMeta}>
                        {session.message_count} message{session.message_count !== 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )
        ) : loading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonGroup}>
                <View style={styles.skeletonLabel} />
                <View style={styles.skeletonCard}>
                  {[1, 2, 3].map((j) => (
                    <View
                      key={j}
                      style={[
                        styles.skeletonItem,
                        j < 3 && styles.skeletonItemBorder,
                      ]}
                    >
                      <View style={styles.skeletonText} />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : groupedScans.length === 0 && searchQuery ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <SearchIcon />
            </View>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>Try a different search term</Text>
          </View>
        ) : groupedScans.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <CameraIcon />
            </View>
            <Text style={styles.emptyTitle}>No scans yet</Text>
            <Text style={styles.emptySubtitle}>
              Scan a product to see your history here
            </Text>
          </View>
        ) : (
          groupedScans.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              <View style={styles.groupCard}>
                {group.items.map((scan, i) => {
                  const price = scan.estimated_price || scan.price;
                  const name = scan.product_name || scan.product_identified || scan.category || 'Unknown scan';
                  return (
                    <TouchableOpacity
                      key={scan.scan_id}
                      style={[
                        styles.sessionItem,
                        i < group.items.length - 1 && styles.sessionItemBorder,
                      ]}
                      onPress={() => handleSelectScan(scan)}
                    >
                      <Text style={styles.sessionTitle} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={styles.sessionMeta}>
                        {scan.overall_score ? `Score: ${scan.overall_score}/100` : ''}
                        {scan.overall_score && price ? ' · ' : ''}
                        {price ? `£${price.toFixed(2)}` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* New chat/scan FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={source === 'faith' ? handleNewChat : onClose}
      >
        {source === 'faith' ? <MessageIcon /> : <CameraIcon />}
        <Text style={styles.fabText}>{source === 'faith' ? 'New Chat' : 'New Scan'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    height: 50,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 16,
  },
  searchBackButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    marginLeft: 8,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  loadingContainer: {
    gap: 12,
  },
  skeletonGroup: {
    marginBottom: 12,
  },
  skeletonLabel: {
    width: 80,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  skeletonItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skeletonItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  skeletonText: {
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    width: '75%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    maxWidth: 200,
  },
  group: {
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  sessionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sessionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sessionItemActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sessionTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  sessionMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: 20,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
