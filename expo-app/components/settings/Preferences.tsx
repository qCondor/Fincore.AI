import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { SettingsPage } from './SettingsPage';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { SettingsToggle } from './SettingsToggle';

interface PreferencesProps {
  onBack: () => void;
}

const PREFS_KEY = 'fincore_preferences';

interface AppPreferences {
  theme: 'Light' | 'Dark' | 'System';
  hapticFeedback: boolean;
  soundEffects: boolean;
}

const defaultPrefs: AppPreferences = {
  theme: 'Light',
  hapticFeedback: true,
  soundEffects: true,
};

function SunIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Circle cx={12} cy={12} r={5} />
      <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </Svg>
  );
}

function TypeIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </Svg>
  );
}

function PoundIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M17 18H7a2 2 0 01-2-2V8a5 5 0 0110 0v2M5 12h8" />
    </Svg>
  );
}

function GlobeIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Circle cx={12} cy={12} r={10} />
      <Path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

function HomeIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <Path d="M9 22V12h6v10" />
    </Svg>
  );
}

function VibrationIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Rect x={5} y={2} width={14} height={20} rx={2} ry={2} />
      <Path d="M1 9v6M23 9v6" />
    </Svg>
  );
}

function VolumeIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
    </Svg>
  );
}

function SparklesIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  );
}

function MessageIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2}>
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </Svg>
  );
}

interface SegmentedControlProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

function SegmentedControl({ options, selected, onSelect }: SegmentedControlProps) {
  return (
    <View style={styles.segmentedControl}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.segment, selected === option && styles.segmentSelected]}
          onPress={() => onSelect(option)}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, selected === option && styles.segmentTextSelected]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function Preferences({ onBack }: PreferencesProps) {
  const [theme, setTheme] = useState<'Light' | 'Dark' | 'System'>('Light');
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const stored = await AsyncStorage.getItem(PREFS_KEY);
        if (stored) {
          const prefs: AppPreferences = JSON.parse(stored);
          setTheme(prefs.theme);
          setHapticFeedback(prefs.hapticFeedback);
          setSoundEffects(prefs.soundEffects);
        }
      } catch (e) {
        console.error('Failed to load preferences:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPrefs();
  }, []);

  // Save preferences on change
  const savePrefs = async (newPrefs: Partial<AppPreferences>) => {
    const prefs: AppPreferences = {
      theme,
      hapticFeedback,
      soundEffects,
      ...newPrefs,
    };
    try {
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to save preferences:', e);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    const t = newTheme as 'Light' | 'Dark' | 'System';
    setTheme(t);
    savePrefs({ theme: t });
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleHapticChange = (value: boolean) => {
    setHapticFeedback(value);
    savePrefs({ hapticFeedback: value });
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleSoundChange = (value: boolean) => {
    setSoundEffects(value);
    savePrefs({ soundEffects: value });
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <SettingsPage title="Preferences" onBack={onBack}>
      <SettingsSection title="Display">
        <View style={styles.themeRow}>
          <View style={styles.themeLabel}>
            <View style={styles.iconContainer}><SunIcon /></View>
            <Text style={styles.themeLabelText}>Theme</Text>
          </View>
          <SegmentedControl
            options={['Light', 'Dark', 'System']}
            selected={theme}
            onSelect={handleThemeChange}
          />
        </View>
        <SettingsRow icon={<TypeIcon />} label="Text Size" value="Medium" onPress={() => {}} isLast />
      </SettingsSection>

      <SettingsSection title="Regional">
        <SettingsRow icon={<PoundIcon />} label="Currency" value="GBP £" onPress={() => {}} />
        <SettingsRow icon={<GlobeIcon />} label="Language" value="English (UK)" onPress={() => {}} />
        <SettingsRow icon={<CalendarIcon />} label="Date Format" value="DD/MM/YYYY" onPress={() => {}} isLast />
      </SettingsSection>

      <SettingsSection title="App">
        <SettingsRow icon={<HomeIcon />} label="Default Home Tab" value="Feels Like" onPress={() => {}} />
        <SettingsToggle icon={<VibrationIcon />} label="Haptic Feedback" value={hapticFeedback} onValueChange={handleHapticChange} />
        <SettingsToggle icon={<VolumeIcon />} label="Sound Effects" value={soundEffects} onValueChange={handleSoundChange} isLast />
      </SettingsSection>

      <SettingsSection title="Faith AI">
        <SettingsRow icon={<SparklesIcon />} label="Nudge Frequency" value="Balanced" onPress={() => {}} />
        <SettingsRow icon={<MessageIcon />} label="Tone" value="Gentle" onPress={() => {}} isLast />
      </SettingsSection>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  themeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  themeLabelText: {
    fontSize: 15,
    color: '#fff',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentSelected: {
    backgroundColor: '#005FCC',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  segmentTextSelected: {
    color: '#fff',
  },
});
