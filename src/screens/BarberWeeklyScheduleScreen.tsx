import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useApp } from '../context/AppContext';
import { useBarberWeeklySchedule } from '../hooks/useBarberWeeklySchedule';
import { 
  getCurrentWeekStartISO, 
  addDaysISO, 
  getStartOfWeekISO 
} from '../utils/dateUtils';

// Import components
import WeekNavigator from '../components/barberSchedule/WeekNavigator';
import WeeklyOverview from '../components/barberSchedule/WeeklyOverview';
import ExceptionsSection from '../components/barberSchedule/ExceptionsSection';
import QuickActionsRow from '../components/barberSchedule/QuickActionsRow';
import WeekStatsCard from '../components/barberSchedule/WeekStatsCard';
import WeekMiniStats from '../components/barberSchedule/WeekMiniStats';
import ScheduleTemplates from '../components/barberSchedule/ScheduleTemplates';

const BarberWeeklyScheduleScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state } = useApp();
  const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentWeekStartISO());

  // Guard: ensure only barber role can access
  useEffect(() => {
    if (state.user?.role !== 'barber') {
      navigation.goBack();
    }
  }, [state.user?.role, navigation]);

  const {
    weekRange,
    days,
    exceptions,
    stats,
    templates,
    loading,
    error,
    actions,
  } = useBarberWeeklySchedule(currentWeekStart);

  // Navigation handlers

  const handlePrevWeek = () => {
    setCurrentWeekStart(addDaysISO(currentWeekStart, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDaysISO(currentWeekStart, 7));
  };

  const handleGoToToday = () => {
    setCurrentWeekStart(getCurrentWeekStartISO());
  };

  const handlePressDay = (dayKey: string) => {
    // TODO: Navigate to day detail screen
    Alert.alert('Day Detail', `Edit ${dayKey} schedule`);
  };

  const handleAddException = () => {
    // TODO: Open add exception modal
    Alert.alert('Add Exception', 'Add exception modal coming soon');
  };

  const handleEditException = (id: string) => {
    // TODO: Open edit exception modal
    Alert.alert('Edit Exception', `Edit exception ${id}`);
  };

  const handleDeleteException = (id: string) => {
    Alert.alert(
      'Delete Exception',
      'Are you sure you want to delete this exception?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => actions.deleteException(id)
        },
      ]
    );
  };

  const handleCopyWeek = () => {
    // TODO: Open copy week modal
    Alert.alert('Copy Week', 'Copy week modal coming soon');
  };

  const handleBulkEdit = () => {
    // TODO: Open bulk edit modal
    Alert.alert('Bulk Edit', 'Bulk edit modal coming soon');
  };

  const handleCreateTemplate = () => {
    // TODO: Navigate to template builder
    Alert.alert('Create Template', 'Template builder coming soon');
  };

  const handleApplyTemplate = (templateId: string) => {
    Alert.alert(
      'Apply Template',
      'Are you sure you want to apply this template to the current week?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          onPress: () => actions.applyTemplate(templateId, currentWeekStart)
        },
      ]
    );
  };

  const quickActions = [
    {
      key: 'copyWeek',
      title: 'Copy Week',
      subtitle: 'Apply to other weeks',
      icon: 'copy-outline',
      onPress: handleCopyWeek,
    },
    {
      key: 'bulkEdit',
      title: 'Bulk Edit',
      subtitle: 'Edit multiple days',
      icon: 'create-outline',
      onPress: handleBulkEdit,
    },
  ];

  // Don't return null for loading/error to avoid blank screen
  // if (loading) {
  //   // TODO: Add loading component
  //   return null;
  // }

  // if (error) {
  //   // TODO: Add error component
  //   return null;
  // }

	return (
		<SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <WeekNavigator
          startDateISO={weekRange.startISO}
          endDateISO={weekRange.endISO}
          isCurrentWeek={weekRange.isCurrentWeek}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onGoToToday={handleGoToToday}
        />

        <WeeklyOverview
          days={days}
          legend={{ availableColor: '#10B981', unavailableColor: '#EF4444' }}
          onPressDay={handlePressDay}
          loading={loading}
        />

        <ExceptionsSection
          items={exceptions}
          onAddException={handleAddException}
          onEditException={handleEditException}
          onDeleteException={handleDeleteException}
        />

        <QuickActionsRow actions={quickActions} />

        <WeekStatsCard
          hoursTotalLabel="Total Hours"
          hoursValue={stats.hoursValue}
          metaLeft={stats.metaLeft}
          metaRight={stats.metaRight}
        />

        <WeekMiniStats
          availableSlots={stats.availableSlots}
          booked={stats.booked}
        />

        <ScheduleTemplates
          templates={templates}
          onCreateTemplate={handleCreateTemplate}
          onApplyTemplate={handleApplyTemplate}
        />
			</ScrollView>
		</SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
	scrollView: {
		flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md, // Reduced from spacing.lg (24px) to spacing.md (16px)
  },
});

export default BarberWeeklyScheduleScreen;
