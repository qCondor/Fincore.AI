import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme, type Theme } from '../../contexts/ThemeContext';

interface PickerRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: readonly string[];
  onSelect: (value: string) => void;
  placeholder?: string;
  isLast?: boolean;
  /** Shown above the list; omit for short lists where search is noise. */
  searchable?: boolean;
}

/**
 * Looks like an EditableRow but opens a list instead of a keyboard, so the
 * value is always one of a known set rather than whatever someone types.
 */
export function PickerRow({
  icon,
  label,
  value,
  options,
  onSelect,
  placeholder,
  isLast = false,
  searchable = false,
}: PickerRowProps) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(o => o.toLowerCase().includes(q));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.row, !isLast && styles.rowBorder]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${value || 'Not set'}. Opens a list to choose from.`}
      >
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Text style={[styles.rowValue, !value && styles.rowPlaceholder]}>
            {value || placeholder}
          </Text>
        </View>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d="M6 9l6 6 6-6" stroke={t.textFaint} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <TouchableOpacity onPress={close}>
                <Text style={styles.sheetCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {searchable && (
              <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholder={`Search ${label.toLowerCase()}`}
                placeholderTextColor={t.textFaint}
                autoCorrect={false}
                autoCapitalize="none"
              />
            )}

            <FlatList
              data={filtered}
              keyExtractor={item => item}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.empty}>No matches</Text>}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      onSelect(item);
                      close();
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item}</Text>
                    {selected && <Text style={styles.tick}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: t.overlayHairline,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.overlayFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: t.type.caption,
    color: t.textTertiary,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: t.type.body,
    color: t.textPrimary,
  },
  rowPlaceholder: {
    color: t.overlayStrong,
  },
  overlay: {
    flex: 1,
    backgroundColor: t.shadowStrong,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: t.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: t.type.title,
    fontWeight: '700',
    color: t.textPrimary,
  },
  sheetCancel: {
    fontSize: t.type.body,
    color: t.textTertiary,
  },
  search: {
    marginHorizontal: 20,
    marginBottom: 8,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: t.overlayHairline,
    color: t.textPrimary,
    fontSize: t.type.body,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: t.overlayHairline,
  },
  optionText: {
    fontSize: t.type.body,
    color: t.textPrimary,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: t.secondary,
  },
  tick: {
    fontSize: t.type.body,
    color: t.secondary,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 24,
    color: t.textFaint,
    fontSize: t.type.body,
  },
});
