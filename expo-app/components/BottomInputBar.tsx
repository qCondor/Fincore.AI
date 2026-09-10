import React, { useState, useRef, useCallback, forwardRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import {
  HomeIcon,
  MicIcon,
  SendIcon,
  PlusIcon,
  BrainIcon,
  MessageIcon,
  CameraNavIcon,
  LandmarkIcon,
  BarChartIcon,
  ChevronRightIcon,
} from './icons';
import { useTheme, type Theme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ActiveScreen = 'profile' | 'faith' | 'scan';

interface BottomInputBarProps {
  activeScreen: ActiveScreen;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onMicPress?: () => void;
  onPlusPress?: () => void;
  onNavigate: (screen: 'profile' | 'faith' | 'scan') => void;
  onComingSoon: (feature: 'banking' | 'analytics') => void;
  bottomInset: number;
  showMic?: boolean;
  disabled?: boolean;
}

export const BottomInputBar = forwardRef<TextInput, BottomInputBarProps>(function BottomInputBar({
  activeScreen,
  placeholder = 'Type a message...',
  value,
  onChangeText,
  onSend,
  onMicPress,
  onPlusPress,
  onNavigate,
  onComingSoon,
  bottomInset,
  showMic = true,
  disabled = false,
}, ref) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [inputFocused, setInputFocused] = useState(false);
  const [navVisible, setNavVisible] = useState(false);
  const navAnim = useRef(new Animated.Value(0)).current;

  const toggleNav = useCallback((show: boolean, callback?: () => void) => {
    if (show) {
      setNavVisible(true);
      Animated.timing(navAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(navAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setNavVisible(false);
        callback?.();
      });
    }
  }, [navAnim]);

  const handleNavPress = (screen: 'profile' | 'faith' | 'scan') => {
    if (screen === activeScreen) {
      toggleNav(false);
    } else {
      toggleNav(false, () => onNavigate(screen));
    }
  };

  const handleComingSoonPress = (feature: 'banking' | 'analytics') => {
    toggleNav(false, () => onComingSoon(feature));
  };

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend();
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: bottomInset + 8 }]}>
      <View style={styles.wrapper}>
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
            <TouchableOpacity style={styles.navItem} onPress={() => handleNavPress('profile')}>
              <BrainIcon active={activeScreen === 'profile'} />
              <Text style={[styles.navLabel, activeScreen === 'profile' && styles.navLabelActive]}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => handleNavPress('faith')}>
              <MessageIcon active={activeScreen === 'faith'} />
              <Text style={[styles.navLabel, activeScreen === 'faith' && styles.navLabelActive]}>Faith</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => handleNavPress('scan')}>
              <CameraNavIcon active={activeScreen === 'scan'} />
              <Text style={[styles.navLabel, activeScreen === 'scan' && styles.navLabelActive]}>Feels Like</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => handleComingSoonPress('banking')}>
              <LandmarkIcon />
              <Text style={styles.navLabel}>Banking</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => handleComingSoonPress('analytics')}>
              <BarChartIcon />
              <Text style={styles.navLabel}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navClose} onPress={() => toggleNav(false)}>
              <ChevronRightIcon />
            </TouchableOpacity>
          </Animated.View>
        )}

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
              <TouchableOpacity
                style={styles.plusButton}
                onPress={onPlusPress ?? (() => setInputFocused(false))}
              >
                <PlusIcon />
              </TouchableOpacity>
            )}
            {!inputFocused && <View style={styles.spacer} />}
            <TextInput
              ref={ref}
              style={styles.textInput}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={t.textFaint}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!disabled}
            />
            {showMic && onMicPress && (
              <TouchableOpacity style={styles.micButton} onPress={onMicPress}>
                <MicIcon />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.sendButton, (!value.trim() || disabled) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!value.trim() || disabled}
            >
              <SendIcon />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
});

const makeStyles = (t: Theme) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 20,
    elevation: 20,
  },
  wrapper: {
    // Sized by inputBarRow (normal flow) so larger text can grow it; the
    // nav bar overlays it with absoluteFill. minHeight keeps Medium at 50.
    minHeight: 50,
    position: 'relative',
  },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
    backgroundColor: t.overlaySubtle,
    borderWidth: 1,
    borderColor: t.overlayMedium,
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
    fontSize: t.type.micro,
    color: t.textFaint,
    marginTop: 2,
  },
  navLabelActive: {
    color: t.textPrimary,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  homeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: t.overlaySubtle,
    borderWidth: 1,
    borderColor: t.overlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBar: {
    flex: 1,
    minHeight: 50,
    borderRadius: 32,
    backgroundColor: t.overlaySubtle,
    borderWidth: 1,
    borderColor: t.overlayMedium,
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
  spacer: {
    width: 8,
  },
  textInput: {
    flex: 1,
    fontSize: t.type.body,
    color: t.textPrimary,
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
    backgroundColor: t.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
