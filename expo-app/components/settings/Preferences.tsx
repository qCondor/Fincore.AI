import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme, type Theme } from '../../contexts/ThemeContext';
import { SettingsPage } from './SettingsPage';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { SettingsToggle } from './SettingsToggle';
import { OptionPickerModal, type PickerOption } from './OptionPickerModal';
import { usePreferences, type ThemeMode, type DefaultHomeTab, type CurrencyCode, type DateFormatPref, type TextScale } from '../../contexts/PreferencesContext';
import { useHaptics } from '../../lib/haptics';
import { useSounds } from '../../lib/sounds';
import { CURRENCY_SYMBOL } from '../../lib/format';

interface PreferencesProps {
  onBack: () => void;
}

function SunIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Circle cx={12} cy={12} r={5} />
      <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </Svg>
  );
}

interface SegmentedControlProps {
  options: readonly string[];
  selected: string;
  onSelect: (option: string) => void;
}

function SegmentedControl({ options, selected, onSelect }: SegmentedControlProps) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

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

function TextSizeIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </Svg>
  );
}

function PoundIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M17 18H7a2 2 0 01-2-2V8a5 5 0 0110 0v2M5 12h8" />
    </Svg>
  );
}

function CalendarIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

function HomeIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <Path d="M9 22V12h6v10" />
    </Svg>
  );
}

function VibrationIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Rect x={5} y={2} width={14} height={20} rx={2} ry={2} />
      <Path d="M1 9v6M23 9v6" />
    </Svg>
  );
}

function VolumeIcon() {
  const t = useTheme();
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={t.textPrimary} strokeWidth={2}>
      <Path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
    </Svg>
  );
}

const HOME_TAB_OPTIONS: PickerOption[] = [
  { value: 'index', label: 'Feels Like' },
  { value: 'faith', label: 'Faith' },
  { value: 'profile', label: 'Profile' },
];

const HOME_TAB_LABELS: Record<DefaultHomeTab, string> = {
  index: 'Feels Like',
  faith: 'Faith',
  profile: 'Profile',
};

const CURRENCY_OPTIONS: PickerOption[] = [
  { value: 'GBP', label: 'British Pound', description: '£ GBP' },
  { value: 'USD', label: 'US Dollar', description: '$ USD' },
  { value: 'EUR', label: 'Euro', description: '€ EUR' },
];

const DATE_FORMAT_OPTIONS: PickerOption[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', description: '31/12/2026' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', description: '12/31/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', description: '2026-12-31' },
];

const THEME_OPTIONS = ['Light', 'Dark', 'System'] as const;

const TEXT_SIZE_OPTIONS: PickerOption[] = [
  { value: 'Small', label: 'Small', description: 'Slightly more compact' },
  { value: 'Medium', label: 'Medium', description: 'Default' },
  { value: 'Large', label: 'Large', description: 'Easier to read' },
];

export function Preferences({ onBack }: PreferencesProps) {
  const { prefs, isLoaded, updatePref } = usePreferences();
  const haptics = useHaptics();
  const sounds = useSounds();
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [textSizePickerOpen, setTextSizePickerOpen] = useState(false);
  const [homeTabPickerOpen, setHomeTabPickerOpen] = useState(false);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [dateFormatPickerOpen, setDateFormatPickerOpen] = useState(false);

  const handleThemeChange = (value: string) => {
    updatePref('theme', value as ThemeMode);
    haptics.impact();
  };

  const handleTextSizeSelect = (value: string) => {
    updatePref('textScale', value as TextScale);
    haptics.impact();
    setTextSizePickerOpen(false);
  };

  const handleHapticChange = (value: boolean) => {
    updatePref('hapticFeedback', value);
    // Fire unconditionally on enable so the user feels the confirmation --
    // gating this one on the pref itself would mean it never fires.
    if (value) {
      haptics.impact();
    }
  };

  const handleSoundChange = (value: boolean) => {
    updatePref('soundEffects', value);
    // Same as haptics: on enable, the pref is still false when the toggle
    // fires, so force the confirmation click through the gate.
    if (value) {
      sounds.playToggle({ force: true });
    }
  };

  const handleHomeTabSelect = (value: string) => {
    updatePref('defaultHomeTab', value as DefaultHomeTab);
    haptics.impact();
    setHomeTabPickerOpen(false);
  };

  const handleCurrencySelect = (value: string) => {
    updatePref('currency', value as CurrencyCode);
    haptics.impact();
    setCurrencyPickerOpen(false);
  };

  const handleDateFormatSelect = (value: string) => {
    updatePref('dateFormat', value as DateFormatPref);
    haptics.impact();
    setDateFormatPickerOpen(false);
  };

  if (!isLoaded) {
    return null;
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
            options={THEME_OPTIONS}
            selected={prefs.theme}
            onSelect={handleThemeChange}
          />
        </View>
        <SettingsRow
          icon={<TextSizeIcon />}
          label="Text Size"
          value={prefs.textScale}
          onPress={() => setTextSizePickerOpen(true)}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Regional">
        <SettingsRow
          icon={<PoundIcon />}
          label="Currency"
          value={`${prefs.currency} ${CURRENCY_SYMBOL[prefs.currency]}`}
          onPress={() => setCurrencyPickerOpen(true)}
        />
        <SettingsRow
          icon={<CalendarIcon />}
          label="Date Format"
          value={prefs.dateFormat}
          onPress={() => setDateFormatPickerOpen(true)}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="App">
        <SettingsRow
          icon={<HomeIcon />}
          label="Default Home Tab"
          value={HOME_TAB_LABELS[prefs.defaultHomeTab]}
          onPress={() => setHomeTabPickerOpen(true)}
        />
        <SettingsToggle
          icon={<VibrationIcon />}
          label="Haptic Feedback"
          value={prefs.hapticFeedback}
          onValueChange={handleHapticChange}
        />
        <SettingsToggle
          icon={<VolumeIcon />}
          label="Sound Effects"
          value={prefs.soundEffects}
          onValueChange={handleSoundChange}
          isLast
        />
      </SettingsSection>

      <OptionPickerModal
        visible={textSizePickerOpen}
        title="Text Size"
        options={TEXT_SIZE_OPTIONS}
        selected={prefs.textScale}
        onSelect={handleTextSizeSelect}
        onClose={() => setTextSizePickerOpen(false)}
      />
      <OptionPickerModal
        visible={homeTabPickerOpen}
        title="Default Home Tab"
        options={HOME_TAB_OPTIONS}
        selected={prefs.defaultHomeTab}
        onSelect={handleHomeTabSelect}
        onClose={() => setHomeTabPickerOpen(false)}
      />
      <OptionPickerModal
        visible={currencyPickerOpen}
        title="Currency"
        options={CURRENCY_OPTIONS}
        selected={prefs.currency}
        onSelect={handleCurrencySelect}
        onClose={() => setCurrencyPickerOpen(false)}
      />
      <OptionPickerModal
        visible={dateFormatPickerOpen}
        title="Date Format"
        options={DATE_FORMAT_OPTIONS}
        selected={prefs.dateFormat}
        onSelect={handleDateFormatSelect}
        onClose={() => setDateFormatPickerOpen(false)}
      />
    </SettingsPage>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  themeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: t.overlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  themeLabelText: {
    fontSize: t.type.body,
    color: t.textPrimary,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: t.overlayFaint,
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentSelected: {
    backgroundColor: t.primary,
  },
  segmentText: {
    fontSize: t.type.caption,
    fontWeight: '500',
    color: t.textMuted,
  },
  segmentTextSelected: {
    color: t.textPrimary,
  },
});
