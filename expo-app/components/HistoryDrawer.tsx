import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useChatHistory, groupSessionsByDate, type ChatSession } from '../hooks/useChatHistory';
import { useScanHistory, groupScansByDate, type ScanRecord } from '../hooks/useScanHistory';
import { useUser } from '../contexts/UserContext';
import { formatCurrency } from '../lib/format';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { WaveBackground } from './WaveBackground';

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
  const t = useTheme();
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2} strokeLinecap="round">
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

function SearchIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2} strokeLinecap="round">
      <Circle cx={11} cy={11} r={8} />
      <Line x1={21} y1={21} x2={16.65} y2={16.65} />
    </Svg>
  );
}

function ArrowLeftIcon() {
  const t = useTheme();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={t.textFaint} strokeWidth={2} strokeLinecap="round">
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  );
}

function MessageIcon() {
  const t = useTheme();
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </Svg>
  );
}

function CameraIcon() {
  const t = useTheme();
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" />
      <Circle cx={12} cy={13} r={4} />
    </Svg>
  );
}

function EmptyMessageIcon() {
  const t = useTheme();
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={t.textGhost} strokeWidth={2}>
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </Svg>
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
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
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
      <WaveBackground prefix="drawer" waves={1} animated={false} />

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
              placeholderTextColor={t.overlayStrong}
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
                        {price ? formatCurrency(price) : ''}
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

const makeStyles = (t: Theme) => StyleSheet.create({
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
    backgroundColor: t.overlayFaint,
    borderWidth: 1,
    borderColor: t.overlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    height: 50,
    borderRadius: 32,
    backgroundColor: t.overlayFaint,
    borderWidth: 1,
    borderColor: t.overlaySubtle,
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
    fontSize: t.type.body,
    color: t.textPrimary,
    marginLeft: 8,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: t.overlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: t.type.display,
    fontWeight: '700',
    color: t.textPrimary,
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
    backgroundColor: t.overlayFaint,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonCard: {
    backgroundColor: t.overlayHairline,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: t.overlayFaint,
    overflow: 'hidden',
  },
  skeletonItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skeletonItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: t.overlayFaint,
  },
  skeletonText: {
    height: 16,
    backgroundColor: t.overlayFaint,
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
    backgroundColor: t.overlayFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: t.type.bodyLarge,
    fontWeight: '600',
    color: t.textSecondary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: t.type.bodySmall,
    color: t.textFaint,
    textAlign: 'center',
    maxWidth: 200,
  },
  group: {
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: t.type.labelLarge,
    fontWeight: '700',
    color: t.textPrimary,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupCard: {
    backgroundColor: t.overlayHairline,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: t.overlayFaint,
    overflow: 'hidden',
  },
  sessionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sessionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: t.overlayFaint,
  },
  sessionItemActive: {
    backgroundColor: t.overlayFaint,
  },
  sessionTitle: {
    fontSize: t.type.bodyCompact,
    color: t.textTertiary,
  },
  sessionMeta: {
    fontSize: t.type.captionSmall,
    color: t.textGhost,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: 20,
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: t.overlayFaint,
    borderWidth: 1,
    borderColor: t.overlaySubtle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabText: {
    fontSize: t.type.body,
    fontWeight: '600',
    color: t.textPrimary,
  },
});
