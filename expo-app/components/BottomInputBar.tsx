import React, { useState, useRef, useCallback } from 'react';
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

export function BottomInputBar({
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
}: BottomInputBarProps) {
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
              style={styles.textInput}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor="rgba(255,255,255,0.45)"
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
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  wrapper: {
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
  spacer: {
    width: 8,
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
    opacity: 0.5,
  },
});
