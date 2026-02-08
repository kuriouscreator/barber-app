import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export interface SettingsSheetRef {
  open: () => void;
  close: () => void;
}

interface SettingsSheetProps {
  title: string;
  children: React.ReactNode;
  height?: number;
}

export const SettingsSheet = forwardRef<SettingsSheetRef, SettingsSheetProps>(
  ({ title, children, height = 650 }, ref) => {
    const rbSheetRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      open: () => rbSheetRef.current?.open(),
      close: () => rbSheetRef.current?.close(),
    }));

    return (
      <RBSheet
        ref={rbSheetRef}
        height={height}
        openDuration={250}
        closeDuration={200}
        customStyles={{
          wrapper: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: colors.white,
          },
          draggableIcon: {
            display: 'none',
          },
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => rbSheetRef.current?.close()}
            >
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </RBSheet>
    );
  }
);

SettingsSheet.displayName = 'SettingsSheet';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
});
