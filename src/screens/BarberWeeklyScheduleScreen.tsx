import React, { useState, useEffect, useRef } from 'react';
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
import { AvailabilityService } from '../services/AvailabilityService';

// Import components
import WeekNavigator from '../components/barberSchedule/WeekNavigator';
import WeeklyOverview from '../components/barberSchedule/WeeklyOverview';
import ExceptionsSection from '../components/barberSchedule/ExceptionsSection';
import QuickActionsRow from '../components/barberSchedule/QuickActionsRow';
import WeekMiniStats from '../components/barberSchedule/WeekMiniStats';
import {
  DayEditorBottomSheet,
  DayEditorSheetRef,
  DayEditData
} from '../components/barberSchedule/DayEditorBottomSheet';
import { ScheduleExceptionModal } from '../components/barberSchedule/ScheduleExceptionModal';
import { CopyWeekModal } from '../components/barberSchedule/CopyWeekModal';

const BarberWeeklyScheduleScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state } = useApp();
  const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentWeekStartISO());
  const [refreshKey, setRefreshKey] = useState(0);
  const dayEditorRef = useRef<DayEditorSheetRef>(null);
  const exceptionModalRef = useRef<any>(null);
  const copyWeekModalRef = useRef<any>(null);
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null);
  const [editingException, setEditingException] = useState<any>(null);

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
  } = useBarberWeeklySchedule(currentWeekStart, state.user?.id, refreshKey);

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
    // Map day key to day of week number
    const dayOfWeekMap: Record<string, number> = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };

    const dayData = days.find(d => d.key === dayKey);
    if (!dayData) return;

    // Parse current time from timeLabel or use defaults
    let startTime = '09:00';
    let endTime = '17:00';
    let isAvailable = dayData.status !== 'unavailable';

    if (isAvailable && dayData.timeLabel !== 'Closed') {
      // Try to extract time from timeLabel (e.g., "9:00 AM - 6:00 PM")
      const timeMatch = dayData.timeLabel.match(/(\d+):(\d+)\s*(AM|PM)\s*-\s*(\d+):(\d+)\s*(AM|PM)/);
      if (timeMatch) {
        let startHour = parseInt(timeMatch[1]);
        if (timeMatch[3] === 'PM' && startHour !== 12) startHour += 12;
        if (timeMatch[3] === 'AM' && startHour === 12) startHour = 0;

        let endHour = parseInt(timeMatch[4]);
        if (timeMatch[6] === 'PM' && endHour !== 12) endHour += 12;
        if (timeMatch[6] === 'AM' && endHour === 12) endHour = 0;

        startTime = `${startHour.toString().padStart(2, '0')}:${timeMatch[2]}`;
        endTime = `${endHour.toString().padStart(2, '0')}:${timeMatch[5]}`;
      }
    }

    const editData: DayEditData = {
      dayOfWeek: dayOfWeekMap[dayKey],
      dayLabel: dayData.dayLabel,
      startTime,
      endTime,
      isAvailable,
    };

    dayEditorRef.current?.open(editData);
  };

  const handleSaveDay = async (data: DayEditData) => {
    if (!state.user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    const success = await AvailabilityService.upsertBarberAvailability(
      state.user.id,
      data.dayOfWeek,
      data.startTime,
      data.endTime,
      data.isAvailable
    );

    if (success) {
      // Trigger refresh by incrementing refreshKey
      setRefreshKey(prev => prev + 1);
      Alert.alert('Success', 'Schedule updated successfully');
    } else {
      Alert.alert('Error', 'Failed to update schedule. Please try again.');
      throw new Error('Failed to save');
    }
  };

  const handleAddException = () => {
    setSelectedExceptionId(null);
    setEditingException(null);
    exceptionModalRef.current?.open();
  };

  const handleEditException = async (id: string) => {
    try {
      // Fetch the full exception data
      const exceptionsList = await AvailabilityService.getScheduleExceptions(
        state.user?.id || '',
        currentWeekStart,
        addDaysISO(currentWeekStart, 6)
      );
      const exception = exceptionsList.find(e => e.id === id);
      if (exception) {
        setSelectedExceptionId(id);
        setEditingException(exception);
        exceptionModalRef.current?.open();
      }
    } catch (error) {
      console.error('Error fetching exception:', error);
      Alert.alert('Error', 'Could not load exception data');
    }
  };

  const handleSaveException = async (exceptionData: any) => {
    try {
      if (exceptionData.id) {
        // Update existing exception
        await AvailabilityService.updateScheduleException(exceptionData.id, {
          date: exceptionData.date,
          isAvailable: exceptionData.isAvailable,
          startTime: exceptionData.startTime,
          endTime: exceptionData.endTime,
          reason: exceptionData.reason,
        });
        Alert.alert('Success', 'Exception updated successfully');
      } else {
        // Create new exception
        await AvailabilityService.createScheduleException(
          state.user?.id || '',
          exceptionData.date,
          exceptionData.isAvailable,
          exceptionData.startTime,
          exceptionData.endTime,
          exceptionData.reason
        );
        Alert.alert('Success', 'Exception created successfully');
      }

      setRefreshKey(prev => prev + 1); // Trigger refresh
      setSelectedExceptionId(null);
    } catch (error) {
      console.error('Error saving exception:', error);
      Alert.alert('Error', 'Failed to save exception. Please try again.');
    }
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
    copyWeekModalRef.current?.open();
  };

  const handleCopyWeekConfirm = async (targetWeeks: string[], includeExceptions: boolean) => {
    if (!state.user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      const success = await AvailabilityService.copyWeekSchedule(
        state.user.id,
        currentWeekStart,
        targetWeeks,
        includeExceptions
      );

      if (success) {
        setRefreshKey(prev => prev + 1);
        const weekCount = targetWeeks.length;
        const weekWord = weekCount === 1 ? 'week' : 'weeks';
        Alert.alert('Success', `Schedule copied to ${weekCount} ${weekWord}`);
      } else {
        Alert.alert('Error', 'Failed to copy schedule. Please try again.');
      }
    } catch (error) {
      console.error('Error copying week:', error);
      Alert.alert('Error', 'Failed to copy schedule. Please try again.');
    }
  };


  const quickActions = [
    {
      key: 'copyWeek',
      title: 'Copy Week',
      subtitle: 'Apply to other weeks',
      icon: 'copy-outline',
      onPress: handleCopyWeek,
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

        <WeekMiniStats
          availableSlots={stats.availableSlots}
          booked={stats.booked}
        />
			</ScrollView>

      {/* Day Editor Bottom Sheet */}
      <DayEditorBottomSheet
        ref={dayEditorRef}
        onSave={handleSaveDay}
      />

      {/* Exception Modal */}
      <ScheduleExceptionModal
        ref={exceptionModalRef}
        barberId={state.user?.id || ''}
        exception={editingException}
        onSave={handleSaveException}
        onClose={() => {
          setSelectedExceptionId(null);
          setEditingException(null);
        }}
      />

      {/* Copy Week Modal */}
      <CopyWeekModal
        ref={copyWeekModalRef}
        sourceWeekStart={currentWeekStart}
        onCopy={handleCopyWeekConfirm}
        onClose={() => {}}
      />
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
