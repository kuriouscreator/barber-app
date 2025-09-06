import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Service, ScheduleException } from '../types';
import ServiceEditModal from '../components/ServiceEditModal';
import ServiceAddModal from '../components/ServiceAddModal';
import ScheduleManagementModal from '../components/ScheduleManagementModal';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

const AdminScreen: React.FC = () => {
  const { state, addService, updateService, deleteService, updateAvailability, addScheduleException, updateScheduleException, deleteScheduleException } = useApp();
  const [activeTab, setActiveTab] = useState<'calendar' | 'services' | 'schedule'>('calendar');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const todayAppointments = state.appointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0];
    return apt.date === today;
  });

  const formatTime = (timeString: string) => {
    return timeString;
  };

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
      id: Date.now().toString(), // Simple ID generation
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

  const handleCloseAddModal = () => {
    setAddModalVisible(false);
  };

  const handleManageSchedule = () => {
    setScheduleModalVisible(true);
  };

  const handleSaveSchedule = (availability: any[]) => {
    updateAvailability(availability);
    setScheduleModalVisible(false);
  };

  const handleCloseScheduleModal = () => {
    setScheduleModalVisible(false);
  };

  const handleAddException = (exception: ScheduleException) => {
    addScheduleException(exception);
  };

  const handleEditException = (exception: ScheduleException) => {
    updateScheduleException(exception);
  };


  const renderTodayAppointment = (appointment: any) => (
    <View key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.appointmentInfo}>
        <Text style={styles.appointmentService}>{appointment.service}</Text>
        <Text style={styles.appointmentTime}>
          {formatTime(appointment.time)}
        </Text>
      </View>
      <View style={[
        styles.statusBadge,
        appointment.status === 'completed' && styles.statusApproved,
        appointment.status === 'confirmed' && styles.statusArrived,
        appointment.status === 'scheduled' && styles.statusPending,
      ]}>
        <Text style={[
          styles.statusText,
          appointment.status === 'completed' && styles.statusTextApproved,
          appointment.status === 'confirmed' && styles.statusTextArrived,
          appointment.status === 'scheduled' && styles.statusTextPending,
        ]}>
          {appointment.status}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your barbershop</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>
            Today's Schedule
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'services' && styles.activeTab]}
          onPress={() => setActiveTab('services')}
        >
          <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
            Services
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedule' && styles.activeTab]}
          onPress={() => setActiveTab('schedule')}
        >
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText]}>
            Schedule
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {activeTab === 'calendar' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>
              Today's Appointments ({todayAppointments.length})
            </Text>
            {todayAppointments.length > 0 ? (
              todayAppointments.map(renderTodayAppointment)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.gray[400]} />
                <Text style={styles.emptyStateText}>No appointments today</Text>
                <Text style={styles.emptyStateSubtext}>
                  Enjoy your free day!
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'services' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Service Management</Text>
            <View style={styles.subscriptionStats}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{state.services.length}</Text>
                <Text style={styles.statLabel}>Active Services</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {state.appointments.filter(apt => apt.status === 'completed').length}
                </Text>
                <Text style={styles.statLabel}>Completed Services</Text>
              </View>
            </View>
            
            <View style={styles.managementCard}>
              <Text style={styles.managementTitle}>Available Services</Text>
              <View style={styles.serviceList}>
                {state.services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.serviceItem}
                    onPress={() => handleEditService(service)}
                  >
                    <View style={styles.serviceItemContent}>
                      <Text style={styles.serviceItemName}>{service.name}</Text>
                      <Text style={styles.serviceDetails}>
                        {service.duration} min • ${service.price}
                      </Text>
                      <Text style={styles.serviceDescription}>{service.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
                  </TouchableOpacity>
                ))}
                {state.services.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="cut-outline" size={48} color={colors.gray[300]} />
                    <Text style={styles.emptyStateText}>No services added yet</Text>
                    <Text style={styles.emptyStateSubtext}>Add your first service to get started</Text>
                  </View>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.managementButton}
                onPress={handleAddService}
              >
                <Ionicons name="add-circle-outline" size={24} color={colors.accent.primary} />
                <Text style={styles.managementButtonText}>Add New Service</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'schedule' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Schedule Management</Text>
            
            <View style={styles.managementCard}>
              <Text style={styles.managementCardTitle}>Weekly Availability</Text>
              <Text style={styles.managementCardSubtitle}>
                Set your working hours for each day of the week
              </Text>
              
              {state.barber?.availability && state.barber.availability.length > 0 ? (
                <View style={styles.schedulePreview}>
                  {state.barber.availability.map((day) => {
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const dayName = dayNames[day.dayOfWeek];
                    
                    return (
                      <View key={day.dayOfWeek} style={styles.scheduleDay}>
                        <Text style={styles.scheduleDayName}>{dayName}</Text>
                        {day.isAvailable ? (
                          <Text style={styles.scheduleTime}>
                            {day.startTime} - {day.endTime}
                          </Text>
                        ) : (
                          <Text style={styles.scheduleUnavailable}>Not available</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={colors.gray[300]} />
                  <Text style={styles.emptyStateText}>No schedule set</Text>
                  <Text style={styles.emptyStateSubtext}>Set your availability to get started</Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.managementButton}
                onPress={handleManageSchedule}
              >
                <Ionicons name="calendar-outline" size={24} color={colors.accent.primary} />
                <Text style={styles.managementButtonText}>Manage Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Service Management Modals */}
      <ServiceEditModal
        visible={editModalVisible}
        service={selectedService}
        onClose={handleCloseEditModal}
        onSave={handleSaveService}
        onDelete={handleDeleteService}
      />
      
      <ServiceAddModal
        visible={addModalVisible}
        onClose={handleCloseAddModal}
        onSave={handleAddNewService}
      />
      
      <ScheduleManagementModal
        visible={scheduleModalVisible}
        availability={state.barber?.availability || []}
        scheduleExceptions={state.barber?.scheduleExceptions || []}
        onClose={handleCloseScheduleModal}
        onSave={handleSaveSchedule}
        onAddException={handleAddException}
        onEditException={handleEditException}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomColor: colors.border.light,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomColor: colors.border.light,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.black,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.black,
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  clientName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  appointmentTime: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  approveButton: {
    backgroundColor: colors.accent.success,
  },
  rejectButton: {
    backgroundColor: colors.accent.error,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  appointmentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentService: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[200],
  },
  statusApproved: {
    backgroundColor: colors.accent.success,
  },
  statusArrived: {
    backgroundColor: colors.accent.warning,
  },
  statusPending: {
    backgroundColor: colors.gray[300],
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  statusTextApproved: {
    color: colors.white,
  },
  statusTextArrived: {
    color: colors.white,
  },
  statusTextPending: {
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyStateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  subscriptionStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    minWidth: 80,
    ...shadows.sm,
  },
  statNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    flexWrap: 'nowrap',
  },
  managementCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  managementTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomColor: colors.border.light,
    borderBottomWidth: 1,
  },
  managementButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  serviceList: {
    marginBottom: spacing.lg,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomColor: colors.border.light,
    borderBottomWidth: 1,
  },
  serviceItemContent: {
    flex: 1,
  },
  serviceItemName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  serviceDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  serviceDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    fontStyle: 'italic',
  },
  managementCardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  managementCardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  schedulePreview: {
    marginBottom: spacing.lg,
  },
  scheduleDay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomColor: colors.border.light,
    borderBottomWidth: 1,
  },
  scheduleDayName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  scheduleTime: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.medium,
  },
  scheduleUnavailable: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[400],
    fontStyle: 'italic',
  },
});

export default AdminScreen;
