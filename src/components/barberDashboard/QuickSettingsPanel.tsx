import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { QuickSettings } from '../../types';

interface QuickSettingsPanelProps {
  settings: QuickSettings;
  onToggle: (key: keyof QuickSettings, value: boolean) => void;
}

const QuickSettingsPanel: React.FC<QuickSettingsPanelProps> = ({ settings, onToggle }) => {
  const settingItems = [
    {
      key: 'appointmentReminders' as keyof QuickSettings,
      icon: 'notifications',
      title: 'Appointment Reminders',
    },
    {
      key: 'visibleToNewClients' as keyof QuickSettings,
      icon: 'eye',
      title: 'Visible to New Clients',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Settings</Text>
      
      <View style={styles.card}>
        {settingItems.map((item) => (
          <View key={item.key} style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons 
                name={item.icon as any} 
                size={20} 
                color={colors.text.secondary} 
                style={styles.settingIcon}
              />
              <Text style={styles.settingTitle}>{item.title}</Text>
            </View>
            <Switch
              value={settings[item.key]}
              onValueChange={(value) => onToggle(item.key, value)}
              trackColor={{
                false: colors.background.secondary,
                true: colors.accent.primary,
              }}
              thumbColor={colors.white}
              accessibilityRole="switch"
              accessibilityLabel={`Toggle ${item.title}`}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    minHeight: 44, // Minimum touch target
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: spacing.sm,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    flex: 1,
  },
});

export default QuickSettingsPanel;
