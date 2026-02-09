import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Appointment, AppointmentFilters } from '../types';
import { AppointmentService } from '../services/AppointmentService';
import { SearchBar } from '../components/SearchBar';
import { FilterChips, FilterOption } from '../components/FilterChips';
import { BarberAppointmentListItem } from '../components/BarberAppointmentListItem';
import { EmptyState } from '../components/EmptyState';
import { AppointmentDetailSheet } from '../components/AppointmentDetailSheet';
import { WalkInFormBottomSheet } from '../components/WalkInFormBottomSheet';
import { FiltersBottomSheet } from '../components/FiltersBottomSheet';
import { SortBottomSheet } from '../components/SortBottomSheet';
import { ServiceService } from '../services/ServiceService';
import { haptics } from '../utils/haptics';

type TabKey = 'today' | 'upcoming' | 'past';
type SortOption = 'soonest' | 'latest' | 'newest' | 'oldest';

const BarberAppointmentsScreen: React.FC = () => {
  const { user } = useAuth();
  const detailsSheetRef = useRef<any>(null);
  const walkInFormRef = useRef<any>(null);
  const filtersSheetRef = useRef<any>(null);
  const sortSheetRef = useRef<any>(null);

  // State
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [services, setServices] = useState<any[]>([]);

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AppointmentFilters>({
    dateRange: 'all',
    appointmentType: 'all',
    status: 'all',
  });
  const [sortBy, setSortBy] = useState<SortOption>('soonest');

  // Load services for walk-in form
  useEffect(() => {
    const loadServices = async () => {
      if (user?.id) {
        try {
          const barberServices = await ServiceService.getBarberServices(user.id);
          setServices(barberServices);
        } catch (error) {
          console.error('Error loading services:', error);
        }
      }
    };
    loadServices();
  }, [user?.id]);

  // Load appointments when tab or filters change
  useEffect(() => {
    if (user?.id) {
      loadAppointments();
    }
  }, [user?.id, activeTab, filters.dateRange]);

  const loadAppointments = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const dateRange = getDateRange();
      const data = await AppointmentService.getBarberAppointments(
        user.id,
        activeTab,
        dateRange
      );
      console.log('📋 Loaded appointments:', data?.length || 0);
      console.log('📋 First appointment:', data?.[0]);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  // Get date range based on current filter
  const getDateRange = (): { start: string; end: string } | undefined => {
    const today = new Date();
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    if (activeTab === 'upcoming') {
      if (filters.dateRange === 'week') {
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7);
        return { start: formatDate(today), end: formatDate(endDate) };
      }
      // 'all' or default - handled by service method
      return undefined;
    } else if (activeTab === 'past') {
      const startDate = new Date(today);
      if (filters.dateRange === 'last7') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (filters.dateRange === 'last30') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (filters.dateRange === 'last90') {
        startDate.setDate(startDate.getDate() - 90);
      } else {
        // 'all' - use default 90 days in service
        return undefined;
      }
      return { start: formatDate(startDate), end: formatDate(today) };
    }

    return undefined;
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Filter and sort appointments based on search, filters, and sort
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt => {
        const customerName = apt.appointmentType === 'walk_in'
          ? (apt.customerName || '').toLowerCase()
          : (apt.customer?.full_name || '').toLowerCase();
        const serviceName = (apt.serviceName || '').toLowerCase();
        return customerName.includes(query) || serviceName.includes(query);
      });
    }

    // Apply appointment type filter
    if (filters.appointmentType !== 'all') {
      filtered = filtered.filter(apt => apt.appointmentType === filters.appointmentType);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const timeA = a.appointmentTime || '';
      const timeB = b.appointmentTime || '';
      const dateA = a.appointmentDate || '';
      const dateB = b.appointmentDate || '';

      if (sortBy === 'soonest') {
        // Earlier times first
        if (dateA === dateB) {
          return timeA.localeCompare(timeB);
        }
        return dateA.localeCompare(dateB);
      } else if (sortBy === 'latest') {
        // Later times first
        if (dateA === dateB) {
          return timeB.localeCompare(timeA);
        }
        return dateB.localeCompare(dateA);
      } else if (sortBy === 'newest') {
        // Most recent dates first
        return dateB.localeCompare(dateA);
      } else if (sortBy === 'oldest') {
        // Oldest dates first
        return dateA.localeCompare(dateB);
      }
      return 0;
    });

    return filtered;
  }, [appointments, searchQuery, filters, sortBy]);

  // Tab change handler
  const handleTabChange = (tab: TabKey) => {
    haptics.light();
    setActiveTab(tab);
    // Reset filters and sort when changing tabs
    setFilters({
      dateRange: 'all',
      appointmentType: 'all',
      status: 'all',
    });
    setSearchQuery('');
    setSortBy(tab === 'past' ? 'newest' : 'soonest');
  };

  // Count active filters (non-default)
  const countActiveFilters = (): number => {
    const defaults = { dateRange: 'all', appointmentType: 'all', status: 'all' };
    let count = 0;
    if (filters.dateRange !== defaults.dateRange) count++;
    if (filters.appointmentType !== 'all') count++;
    if (filters.status !== 'all') count++;
    return count;
  };

  // Open filter sheet
  const handleOpenFilters = () => {
    haptics.light();
    filtersSheetRef.current?.open();
  };

  // Open sort sheet
  const handleOpenSort = () => {
    haptics.light();
    sortSheetRef.current?.open();
  };

  // Apply filters from sheet
  const handleApplyFilters = (newFilters: AppointmentFilters) => {
    setFilters(newFilters);
  };

  // Apply sort from sheet
  const handleApplySort = (newSort: SortOption) => {
    setSortBy(newSort);
  };

  // Clear all filters
  const handleClearFilters = () => {
    haptics.light();
    setFilters({
      dateRange: 'all',
      appointmentType: 'all',
      status: 'all',
    });
  };

  // Date range filter options based on active tab
  const dateRangeOptions: FilterOption[] = useMemo(() => {
    if (activeTab === 'today') {
      return [{ key: 'all', label: 'Today' }];
    } else if (activeTab === 'upcoming') {
      return [
        { key: 'all', label: 'All Upcoming' },
        { key: 'week', label: 'This Week' },
      ];
    } else {
      return [
        { key: 'all', label: 'All Past' },
        { key: 'last7', label: 'Last 7 days' },
        { key: 'last30', label: 'Last 30 days' },
        { key: 'last90', label: 'Last 90 days' },
      ];
    }
  }, [activeTab]);

  // Appointment type filter options
  const typeOptions: FilterOption[] = [
    { key: 'all', label: 'All' },
    { key: 'walk_in', label: 'Walk-ins' },
    { key: 'booking', label: 'Bookings' },
  ];

  // Status filter options
  const statusOptions: FilterOption[] = [
    { key: 'all', label: 'All' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'no_show', label: 'No-show' },
  ];

  // Handlers
  const handleAppointmentPress = useCallback((appointment: Appointment) => {
    haptics.medium();
    setSelectedAppointment(appointment);
    detailsSheetRef.current?.open();
  }, []);

  const handleCloseDetailsSheet = useCallback(() => {
    detailsSheetRef.current?.close();
    setSelectedAppointment(null);
  }, []);

  const handleAddWalkIn = () => {
    haptics.medium();
    if (services.length === 0) {
      Alert.alert('No Services', 'Please add services before creating walk-in appointments');
      return;
    }
    walkInFormRef.current?.open();
  };

  const handleSaveWalkIn = async (walkInData: any) => {
    try {
      await AppointmentService.createWalkInAppointment(walkInData);
      Alert.alert('Success', 'Walk-in appointment created successfully');
      await loadAppointments();
    } catch (error: any) {
      console.error('Error creating walk-in:', error);
      throw error;
    }
  };

  // Render appointment item
  const renderAppointment = useCallback(({ item }: { item: Appointment }) => (
    <BarberAppointmentListItem
      appointment={item}
      onPress={() => handleAppointmentPress(item)}
    />
  ), [handleAppointmentPress]);

  // Empty state based on tab
  const renderEmptyState = () => {
    if (loading) return null;

    let title = 'No appointments';
    let subtitle = '';
    let icon: keyof typeof Ionicons.glyphMap = 'calendar-outline';
    let actionLabel: string | undefined;
    let onAction: (() => void) | undefined;

    if (searchQuery || filters.appointmentType !== 'all' || filters.status !== 'all') {
      title = 'No results found';
      subtitle = 'Try adjusting your filters or search query';
      icon = 'search-outline';
    } else {
      if (activeTab === 'today') {
        title = 'No appointments today';
        subtitle = 'Your schedule is clear for today';
        icon = 'calendar-clear-outline';
        actionLabel = 'Add Walk-In';
        onAction = handleAddWalkIn;
      } else if (activeTab === 'upcoming') {
        title = 'No upcoming appointments';
        subtitle = 'Looks like your schedule is open';
        icon = 'calendar-outline';
        actionLabel = 'Add Walk-In';
        onAction = handleAddWalkIn;
      } else {
        title = 'No past appointments';
        subtitle = 'Past appointments will appear here';
        icon = 'time-outline';
      }
    }

    return (
      <EmptyState
        icon={icon}
        title={title}
        subtitle={subtitle}
        actionLabel={actionLabel}
        onAction={onAction}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'today' && styles.segmentActive]}
          onPress={() => handleTabChange('today')}
        >
          <Text style={[styles.segmentText, activeTab === 'today' && styles.segmentTextActive]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'upcoming' && styles.segmentActive]}
          onPress={() => handleTabChange('upcoming')}
        >
          <Text style={[styles.segmentText, activeTab === 'upcoming' && styles.segmentTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'past' && styles.segmentActive]}
          onPress={() => handleTabChange('past')}
        >
          <Text style={[styles.segmentText, activeTab === 'past' && styles.segmentTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar with Filter Icon */}
      <SearchBar
        placeholder="Search by customer or service name"
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFilterPress={handleOpenFilters}
        filterCount={countActiveFilters()}
      />

      {/* Active Filters Indicator */}
      {countActiveFilters() > 0 && (
        <View style={styles.activeFiltersContainer}>
          <View style={styles.activeFiltersPill}>
            <Text style={styles.activeFiltersText}>
              {filters.dateRange !== 'all' && dateRangeOptions.find(opt => opt.key === filters.dateRange)?.label}
              {filters.dateRange !== 'all' && filters.appointmentType !== 'all' && ' • '}
              {filters.appointmentType !== 'all' && typeOptions.find(opt => opt.key === filters.appointmentType)?.label}
              {(filters.dateRange !== 'all' || filters.appointmentType !== 'all') && filters.status !== 'all' && ' • '}
              {filters.status !== 'all' && statusOptions.find(opt => opt.key === filters.status)?.label}
            </Text>
            <TouchableOpacity onPress={handleClearFilters} style={styles.clearFiltersButton}>
              <Ionicons name="close-circle" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Appointments List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.primary}
            />
          }
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}

      {/* Floating Action Button */}
      {activeTab !== 'past' && (
        <TouchableOpacity style={styles.fab} onPress={handleAddWalkIn}>
          <Ionicons name="person-add" size={24} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* Appointment Detail Sheet */}
      <AppointmentDetailSheet
        ref={detailsSheetRef}
        appointment={selectedAppointment}
        userRole="barber"
        onClose={handleCloseDetailsSheet}
        onStatusUpdated={loadAppointments}
      />

      {/* Walk-In Form */}
      {user?.id && (
        <WalkInFormBottomSheet
          ref={walkInFormRef}
          barberId={user.id}
          date={getTodayDate()}
          services={services}
          onSave={handleSaveWalkIn}
        />
      )}

      {/* Filters Bottom Sheet */}
      <FiltersBottomSheet
        ref={filtersSheetRef}
        activeTab={activeTab}
        initialFilters={filters}
        onApply={handleApplyFilters}
        onClose={() => {}}
      />

      {/* Sort Bottom Sheet */}
      <SortBottomSheet
        ref={sortSheetRef}
        activeTab={activeTab}
        initialSort={sortBy}
        onApply={handleApplySort}
        onClose={() => {}}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  segmentActive: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  segmentText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  },
  segmentTextActive: {
    color: colors.text.primary,
  },
  activeFiltersContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  activeFiltersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    alignSelf: 'flex-start',
  },
  activeFiltersText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  clearFiltersButton: {
    padding: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl * 2,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});

export default BarberAppointmentsScreen;
