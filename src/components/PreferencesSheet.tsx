import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { haptics } from '../utils/haptics';

export interface PreferencesSheetRef {
  open: () => void;
  close: () => void;
}

interface PreferencesSheetProps {
  userId?: string;
  onClose?: () => void;
  onSaved?: () => void;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  barber_id: string;
}

export const PreferencesSheet = forwardRef<PreferencesSheetRef, PreferencesSheetProps>(
  ({ userId, onClose, onSaved }, ref) => {
    const rbSheetRef = useRef<any>(null);
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [favoriteServiceId, setFavoriteServiceId] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      open: async () => {
        rbSheetRef.current?.open();
        await loadData();
      },
      close: () => rbSheetRef.current?.close(),
    }));

    const loadData = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Load all active services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (servicesError) {
          console.error('Error loading services:', servicesError);
          Alert.alert('Error', 'Failed to load services');
          return;
        }

        // Load user's favorite service (only one)
        const { data: favoriteData, error: favoriteError } = await supabase
          .from('favorite_services')
          .select('service_id')
          .eq('user_id', userId)
          .single();

        if (favoriteError && favoriteError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned", which is fine
          console.error('Error loading favorite:', favoriteError);
        }

        setServices(servicesData || []);
        setFavoriteServiceId(favoriteData?.service_id || null);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };

    const selectFavorite = async (serviceId: string) => {
      if (!userId) return;

      try {
        haptics.selection();

        // If selecting the same service, do nothing
        if (favoriteServiceId === serviceId) {
          return;
        }

        // Delete any existing favorite first
        if (favoriteServiceId) {
          await supabase
            .from('favorite_services')
            .delete()
            .eq('user_id', userId);
        }

        // Add the new favorite
        const { error } = await supabase
          .from('favorite_services')
          .insert({
            user_id: userId,
            service_id: serviceId,
          });

        if (error) throw error;

        setFavoriteServiceId(serviceId);
        haptics.success();
      } catch (error) {
        console.error('Error selecting favorite:', error);
        Alert.alert('Error', 'Failed to update favorite service. Please try again.');
      }
    };

    const handleClose = () => {
      rbSheetRef.current?.close();
      if (onClose) onClose();
    };

    const formatPrice = (price: number) => {
      return `$${(price / 100).toFixed(2)}`;
    };

    const formatDuration = (minutes: number) => {
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    return (
      <RBSheet
        ref={rbSheetRef}
        height={600}
        openDuration={250}
        closeDuration={200}
        customStyles={{
          wrapper: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          draggableIcon: {
            display: 'none',
          },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: colors.white,
          },
        }}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Favorite Services</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gray[700]} />
              <Text style={styles.loadingText}>Loading services...</Text>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Description */}
              <Text style={styles.description}>
                Select your favorite service. It will be automatically pre-selected when booking appointments.
              </Text>

              {/* Services List */}
              {services.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="cut-outline" size={48} color={colors.gray[300]} />
                  <Text style={styles.emptyStateText}>No services available</Text>
                </View>
              ) : (
                <View style={styles.servicesList}>
                  {services.map((service) => {
                    const isSelected = favoriteServiceId === service.id;
                    return (
                      <TouchableOpacity
                        key={service.id}
                        style={[
                          styles.serviceItem,
                          isSelected && styles.serviceItemFavorite,
                        ]}
                        onPress={() => selectFavorite(service.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.serviceInfo}>
                          <View style={styles.serviceHeader}>
                            <Text style={styles.serviceName}>{service.name}</Text>
                            <View style={styles.radioButton}>
                              {isSelected && (
                                <View style={styles.radioButtonInner} />
                              )}
                            </View>
                          </View>
                          {service.description && (
                            <Text style={styles.serviceDescription} numberOfLines={2}>
                              {service.description}
                            </Text>
                          )}
                          <View style={styles.serviceDetails}>
                            <View style={styles.serviceDetail}>
                              <Ionicons name="time-outline" size={16} color={colors.gray[500]} />
                              <Text style={styles.serviceDetailText}>
                                {formatDuration(service.duration_minutes)}
                              </Text>
                            </View>
                            <View style={styles.serviceDetail}>
                              <Ionicons name="cash-outline" size={16} color={colors.gray[500]} />
                              <Text style={styles.serviceDetailText}>
                                {formatPrice(service.price)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Info Box */}
              {services.length > 0 && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color={colors.gray[600]} />
                  <Text style={styles.infoText}>
                    Select one service as your favorite. It will be pre-selected when you book appointments.
                  </Text>
                </View>
              )}

              {/* Done Button */}
              <TouchableOpacity
                style={styles.doneButton}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </RBSheet>
    );
  }
);

PreferencesSheet.displayName = 'PreferencesSheet';

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.gray[600],
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.gray[500],
    marginTop: 12,
  },
  servicesList: {
    gap: 12,
  },
  serviceItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  serviceItemFavorite: {
    borderColor: colors.accent.primary,
    borderWidth: 2,
    backgroundColor: colors.accent.primary + '05',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
  },
  serviceDescription: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceDetailText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  doneButton: {
    backgroundColor: colors.gray[800],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent.primary,
  },
});

export default PreferencesSheet;
