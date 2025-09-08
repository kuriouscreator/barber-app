import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/index';
import { TemplateSummary } from '../../types';

interface ScheduleTemplatesProps {
  templates: TemplateSummary[];
  onCreateTemplate: () => void;
  onApplyTemplate: (id: string) => void;
}

interface TemplateRowProps {
  icon: string;
  name: string;
  lines: string[];
  onApply: () => void;
}

const TemplateRow: React.FC<TemplateRowProps> = ({
  icon,
  name,
  lines,
  onApply,
}) => {
  return (
    <View style={styles.templateRow}>
      <View style={styles.iconBadge}>
        <Ionicons name={icon as any} size={20} color={colors.white} />
      </View>
      
      <View style={styles.templateContent}>
        <Text style={styles.templateName}>{name}</Text>
        {lines.map((line, index) => (
          <Text key={index} style={styles.templateLine}>{line}</Text>
        ))}
      </View>
      
      <TouchableOpacity onPress={onApply} style={styles.applyButton}>
        <Text style={styles.applyButtonText}>Apply</Text>
      </TouchableOpacity>
    </View>
  );
};

const ScheduleTemplates: React.FC<ScheduleTemplatesProps> = ({
  templates,
  onCreateTemplate,
  onApplyTemplate,
}) => {
  const renderTemplateRow = ({ item }: { item: TemplateSummary }) => (
    <TemplateRow
      icon="bookmark"
      name={item.name}
      lines={item.lines}
      onApply={() => onApplyTemplate(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule Templates</Text>
        <TouchableOpacity onPress={onCreateTemplate}>
          <Text style={styles.createButton}>Create Template</Text>
        </TouchableOpacity>
      </View>
      
      {templates.length > 0 ? (
        <View style={styles.templatesContainer}>
          <FlatList
            data={templates}
            renderItem={renderTemplateRow}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No templates created yet</Text>
        </View>
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={onCreateTemplate}>
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderColor: colors.border.light,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    marginHorizontal: 0, // Remove margin since parent now handles horizontal spacing
    marginVertical: spacing.md,
    shadowColor: '#0000000D',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowRadius: 2,
    elevation: 2,
    marginBottom: spacing.xl, // Extra space for FAB
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  createButton: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
  },
  templatesContainer: {
    padding: spacing.lg,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  templateContent: {
    flex: 1,
  },
  templateName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  templateLine: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  applyButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    bottom: -20,
    right: 0, // Align with card edge since parent handles horizontal spacing
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0000000D',
    shadowOpacity: 0.2,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ScheduleTemplates;
