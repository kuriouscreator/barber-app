import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { Service } from '../../types';
import ServiceAddModal from '../../components/ServiceAddModal';
import ServiceEditModal from '../../components/ServiceEditModal';

interface ServicesSetupScreenProps {
  onContinue: (services: Service[]) => void;
  onBack?: () => void;
  initialServices?: Service[];
  currentStep: number;
  totalSteps: number;
}

const ServicesSetupScreen: React.FC<ServicesSetupScreenProps> = ({
  onContinue,
  onBack,
  initialServices = [],
  currentStep,
  totalSteps,
}) => {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleAddService = (serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...serviceData,
      id: Date.now().toString(),
    };
    setServices([...services, newService]);
    setAddModalVisible(false);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setEditModalVisible(true);
  };

  const handleSaveService = (service: Service) => {
    setServices(services.map(s => (s.id === service.id ? service : s)));
    setEditModalVisible(false);
    setSelectedService(null);
  };

  const handleDeleteService = (serviceId: string) => {
    setServices(services.filter(s => s.id !== serviceId));
    setEditModalVisible(false);
    setSelectedService(null);
  };

  const handleContinue = () => {
    if (services.length === 0) {
      Alert.alert(
        'Add at least one service',
        'You need to add at least one service before continuing.'
      );
      return;
    }

    onContinue(services);
  };

  const renderServiceItem = ({ item, index }: { item: Service; index: number }) => (
    <TouchableOpacity
      style={[
        styles.serviceItem,
        index === services.length - 1 && styles.serviceItemLast,
      ]}
      onPress={() => handleEditService(item)}
      activeOpacity={0.7}
    >
      <View style={styles.serviceItemContent}>
        <Text style={styles.serviceItemName}>{item.name}</Text>
        <Text style={styles.serviceDetails}>
          {item.duration} min • ${item.price.toFixed(2)}
        </Text>
        {item.description && (
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.progressDots}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index < currentStep && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Ionicons name="cut" size={48} color={colors.accent.primary} />
          <Text style={styles.title}>Add your services</Text>
          <Text style={styles.subtitle}>
            List the services you offer so customers can book appointments
          </Text>
        </View>

        {/* Services List or Empty State */}
        {services.length > 0 ? (
          <View style={styles.servicesContainer}>
            <Text style={styles.servicesCount}>
              {services.length} {services.length === 1 ? 'service' : 'services'} added
            </Text>
            <View style={styles.servicesCard}>
              <FlatList
                data={services}
                renderItem={renderServiceItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={true}
                style={styles.servicesList}
              />
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cut-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyStateTitle}>No services yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Add your first service to get started
            </Text>
          </View>
        )}

        {/* Add Service Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.accent.primary} />
          <Text style={styles.addButtonText}>Add Service</Text>
        </TouchableOpacity>
      </View>

      {/* Footer with Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, services.length === 0 && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={services.length === 0}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Service Add Modal */}
      <ServiceAddModal
        visible={addModalVisible}
        onSave={handleAddService}
        onClose={() => setAddModalVisible(false)}
      />

      {/* Service Edit Modal */}
      {selectedService && (
        <ServiceEditModal
          visible={editModalVisible}
          service={selectedService}
          onSave={handleSaveService}
          onDelete={handleDeleteService}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedService(null);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[300],
  },
  dotActive: {
    backgroundColor: colors.accent.primary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  servicesContainer: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  servicesCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  servicesCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  servicesList: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  serviceItemLast: {
    borderBottomWidth: 0,
  },
  serviceItemContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  serviceItemName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  serviceDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  serviceDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptyStateSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    borderStyle: 'dashed',
    marginBottom: spacing.lg,
  },
  addButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.primary,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default ServicesSetupScreen;
