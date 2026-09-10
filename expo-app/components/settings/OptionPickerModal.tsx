import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme, type Theme } from '../../contexts/ThemeContext';

export interface PickerOption {
  value: string;
  label: string;
  description?: string;
}

interface OptionPickerModalProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function CheckIcon() {
  const t = useTheme();
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

export function OptionPickerModal({ visible, title, options, selected, onSelect, onClose }: OptionPickerModalProps) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>

          {options.map((option, i) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, i < options.length - 1 && styles.optionBorder]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.7}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                {option.description && <Text style={styles.optionDescription}>{option.description}</Text>}
              </View>
              {selected === option.value && <CheckIcon />}
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: t.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    backgroundColor: t.surfaceModal,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: t.overlayFaint,
  },
  title: {
    fontSize: t.type.title,
    fontWeight: '700',
    color: t.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: t.overlayFaint,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: t.type.bodyLarge,
    color: t.textPrimary,
  },
  optionDescription: {
    fontSize: t.type.bodySmall,
    color: t.textFaint,
    marginTop: 2,
  },
  closeButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: t.overlayFaint,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: t.type.bodyLarge,
    fontWeight: '600',
    color: t.textPrimary,
  },
});
