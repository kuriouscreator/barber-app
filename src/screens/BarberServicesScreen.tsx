import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Service } from '../types';
import ServiceEditModal from '../components/ServiceEditModal';
import ServiceAddModal from '../components/ServiceAddModal';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, shadows } from '../theme/spacing';
import { cleanScheduler } from '../theme/cleanScheduler';

const BarberServicesScreen: React.FC = () => {
  const { state, addService, updateService, deleteService } = useApp();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setEditModalVisible(true);
  };

  const handleAddService = () => {
    setAddModalVisible(true);
  };

  const handleSaveService = (service: Service) => {
    updateService(service);
    setEditModalVisible(false);
    setSelectedService(null);
  };

  const handleAddNewService = (serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...serviceData,
      id: Date.now().toString(),
    };
    addService(newService);
    setAddModalVisible(false);
  };

  const handleDeleteService = (serviceId: string) => {
    deleteService(serviceId);
    setEditModalVisible(false);
    setSelectedService(null);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setSelectedService(null);
  };

  const ListSeparator = () => <View style={styles.rowDivider} />;

  const renderServiceRow = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => handleEditService(item)}
      activeOpacity={0.7}
    >
      <View style={styles.serviceItemContent}>
        <Text style={styles.serviceItemName}>{item.name}</Text>
        <Text style={styles.serviceDetails}>
          {item.duration} min • ${item.price.toFixed(2)}
        </Text>
        {item.description ? (
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={cleanScheduler.text.subtext} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cut-outline" size={56} color={cleanScheduler.text.subtext} />
      <Text style={styles.emptyStateTitle}>No services yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Add your first service to start accepting bookings
      </Text>
      <TouchableOpacity style={styles.emptyStateCTA} onPress={handleAddService} activeOpacity={0.7}>
        <Text style={styles.emptyStateCTAText}>Add Service</Text>
      </TouchableOpacity>
    </View>
  );

  const listContent =
    state.services.length > 0 ? (
      <FlatList
        data={state.services}
        renderItem={renderServiceRow}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ListSeparator}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    ) : (
      renderEmptyState()
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.servicesCard}>{listContent}</View>
      </ScrollView>

      {state.services.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddService} activeOpacity={0.8}>
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      {selectedService && (
        <ServiceEditModal
          visible={editModalVisible}
          service={selectedService}
          onSave={handleSaveService}
          onDelete={handleDeleteService}
          onClose={handleCloseEditModal}
        />
      )}

      <ServiceAddModal
        visible={addModalVisible}
        onSave={handleAddNewService}
        onClose={() => setAddModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cleanScheduler.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: cleanScheduler.padding,
    paddingTop: cleanScheduler.sectionSpacing,
    paddingBottom: spacing.xl * 2,
  },
  servicesCard: {
    backgroundColor: cleanScheduler.card.bg,
    borderRadius: cleanScheduler.card.radius,
    borderWidth: 1,
    borderColor: cleanScheduler.card.border,
    overflow: 'hidden',
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  rowDivider: {
    height: 1,
    backgroundColor: cleanScheduler.card.border,
    marginHorizontal: cleanScheduler.padding,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: cleanScheduler.padding,
    minHeight: 44,
  },
  serviceItemContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  serviceItemName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: cleanScheduler.text.heading,
    marginBottom: spacing.xs,
  },
  serviceDetails: {
    fontSize: typography.fontSize.sm,
    color: cleanScheduler.text.body,
    marginBottom: spacing.xs,
  },
  serviceDescription: {
    fontSize: typography.fontSize.sm,
    color: cleanScheduler.text.subtext,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: cleanScheduler.padding,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: cleanScheduler.text.body,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptyStateSubtitle: {
    fontSize: typography.fontSize.base,
    color: cleanScheduler.text.subtext,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyStateCTA: {
    backgroundColor: cleanScheduler.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  emptyStateCTAText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: cleanScheduler.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});

export default BarberServicesScreen;
