import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';

interface DatePickerModalProps {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onDismiss: () => void;
  mode?: 'date' | 'time' | 'datetime';
  title?: string;
}

export function DatePickerModal({
  visible,
  value,
  onConfirm,
  onDismiss,
  mode = 'date',
  title,
}: DatePickerModalProps) {
  const [innerValue, setInnerValue] = React.useState(value);

  React.useEffect(() => {
    if (visible) setInnerValue(value);
  }, [visible, value]);

  const handleChange = (_evt: unknown, selectedDate?: Date) => {
    if (selectedDate) setInnerValue(selectedDate);
  };

  const handleConfirm = () => {
    onConfirm(innerValue);
    onDismiss();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={styles.holder}>
          <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            <DateTimePicker
              value={innerValue}
              mode={mode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleChange}
              style={styles.picker}
            />
            <View style={styles.actions}>
              <Pressable style={styles.cancelBtn} onPress={onDismiss}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.doneBtn} onPress={handleConfirm}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  holder: {
    alignItems: 'center',
  },
  panel: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    paddingBottom: 34,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    paddingVertical: 16,
  },
  picker: {
    height: 200,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    gap: 16,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelText: {
    fontSize: 17,
    color: colors.textMuted,
  },
  doneBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
  },
});
