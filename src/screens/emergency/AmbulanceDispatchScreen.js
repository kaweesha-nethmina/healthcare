import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS
} from '../../constants';
import Card from '../../components/Card';
import Button from '../../components/Button';

const AmbulanceDispatchScreen = ({ navigation, route }) => {
  const { userProfile } = useAuth();
  const { emergencyId } = route.params || {};
  
  const [ambulances, setAmbulances] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadAmbulanceData();
    // Set up real-time updates
    const interval = setInterval(loadAmbulanceData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAmbulanceData = async () => {
    try {
      // In a real app, fetch from Firebase real-time
      setAmbulances(mockAmbulances);
      setDispatches(mockDispatches);
    } catch (error) {
      console.error('Error loading ambulance data:', error);
      setAmbulances(mockAmbulances);
      setDispatches(mockDispatches);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAmbulanceData();
    setRefreshing(false);
  };

  const handleDispatchAmbulance = (ambulance, emergency) => {
    Alert.alert(
      'Dispatch Ambulance',
      `Dispatch ${ambulance.callSign} to emergency ${emergency?.id || 'location'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch',
          onPress: () => {
            // Update ambulance status
            const updatedAmbulances = ambulances.map(a =>
              a.id === ambulance.id 
                ? { ...a, status: 'dispatched', currentEmergency: emergency?.id || emergencyId }
                : a
            );
            setAmbulances(updatedAmbulances);
            
            // Add to dispatch list
            const newDispatch = {
              id: `DISP${Date.now()}`,
              ambulanceId: ambulance.id,
              emergencyId: emergency?.id || emergencyId,
              dispatchTime: new Date().toISOString(),
              status: 'en_route',
              estimatedArrival: new Date(Date.now() + 15 * 60000).toISOString() // 15 minutes
            };
            setDispatches([newDispatch, ...dispatches]);
            
            setShowDispatchModal(false);
            Alert.alert('Success', `${ambulance.callSign} has been dispatched.`);
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return COLORS.SUCCESS;
      case 'dispatched':
        return COLORS.WARNING;
      case 'on_scene':
        return COLORS.INFO;
      case 'transporting':
        return COLORS.PRIMARY;
      case 'out_of_service':
        return COLORS.ERROR;
      default:
        return COLORS.GRAY_MEDIUM;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return 'checkmark-circle';
      case 'dispatched':
        return 'car-sport';
      case 'on_scene':
        return 'location';
      case 'transporting':
        return 'medical';
      case 'out_of_service':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const AmbulanceCard = ({ ambulance }) => (
    <Card style={[styles.ambulanceCard, { borderLeftColor: getStatusColor(ambulance.status) }]}>
      <View style={styles.ambulanceHeader}>
        <View style={styles.ambulanceInfo}>
          <Text style={styles.callSign}>{ambulance.callSign}</Text>
          <Text style={styles.vehicleType}>{ambulance.type}</Text>
          <Text style={styles.location}>📍 {ambulance.currentLocation}</Text>
          <Text style={styles.crew}>Crew: {ambulance.crew.join(', ')}</Text>
        </View>
        <View style={styles.ambulanceStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ambulance.status) }]}>
            <Ionicons 
              name={getStatusIcon(ambulance.status)} 
              size={12} 
              color={COLORS.WHITE} 
            />
            <Text style={styles.statusText}>
              {ambulance.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.eta}>ETA: {ambulance.eta}</Text>
        </View>
      </View>

      <View style={styles.ambulanceStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{ambulance.equipment.length}</Text>
          <Text style={styles.statLabel}>Equipment</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{ambulance.fuelLevel}%</Text>
          <Text style={styles.statLabel}>Fuel</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{ambulance.totalCalls}</Text>
          <Text style={styles.statLabel}>Calls Today</Text>
        </View>
      </View>

      <View style={styles.ambulanceActions}>
        {ambulance.status === 'available' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.PRIMARY }]}
            onPress={() => {
              setSelectedAmbulance(ambulance);
              setShowDispatchModal(true);
            }}
          >
            <Ionicons name="send" size={16} color={COLORS.WHITE} />
            <Text style={styles.actionText}>Dispatch</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.INFO }]}
          onPress={() => Alert.alert('Feature Coming Soon', 'Live tracking will be available soon.')}
        >
          <Ionicons name="location" size={16} color={COLORS.WHITE} />
          <Text style={styles.actionText}>Track</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.SUCCESS }]}
          onPress={() => Alert.alert('Radio Contact', `Contacting ${ambulance.callSign}...`)}
        >
          <Ionicons name="radio" size={16} color={COLORS.WHITE} />
          <Text style={styles.actionText}>Radio</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const DispatchCard = ({ dispatch }) => {
    const ambulance = ambulances.find(a => a.id === dispatch.ambulanceId);
    
    return (
      <Card style={styles.dispatchCard}>
        <View style={styles.dispatchHeader}>
          <Text style={styles.dispatchId}>Dispatch #{dispatch.id}</Text>
          <Text style={styles.dispatchTime}>
            {new Date(dispatch.dispatchTime).toLocaleTimeString()}
          </Text>
        </View>
        
        <View style={styles.dispatchDetails}>
          <Text style={styles.dispatchAmbulance}>
            {ambulance?.callSign} → Emergency #{dispatch.emergencyId}
          </Text>
          <Text style={styles.dispatchStatus}>
            Status: {dispatch.status.replace('_', ' ').toUpperCase()}
          </Text>
          <Text style={styles.dispatchEta}>
            ETA: {new Date(dispatch.estimatedArrival).toLocaleTimeString()}
          </Text>
        </View>
      </Card>
    );
  };

  const DispatchModal = () => (
    <Modal
      visible={showDispatchModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDispatchModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Dispatch {selectedAmbulance?.callSign}</Text>
            <TouchableOpacity onPress={() => setShowDispatchModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalSubtitle}>Select Emergency or Location</Text>
            
            {/* Emergency List */}
            <View style={styles.emergencyList}>
              {mockEmergencies.map((emergency) => (
                <TouchableOpacity
                  key={emergency.id}
                  style={styles.emergencyOption}
                  onPress={() => handleDispatchAmbulance(selectedAmbulance, emergency)}
                >
                  <View style={styles.emergencyInfo}>
                    <Text style={styles.emergencyId}>#{emergency.id}</Text>
                    <Text style={styles.emergencyLocation}>{emergency.location}</Text>
                    <Text style={styles.emergencyType}>{emergency.type}</Text>
                  </View>
                  <View style={[styles.priorityIndicator, { 
                    backgroundColor: emergency.priority === 'critical' ? COLORS.EMERGENCY :
                                   emergency.priority === 'high' ? COLORS.WARNING : COLORS.INFO
                  }]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={() => setShowDispatchModal(false)}
              style={styles.modalActionButton}
              variant="outline"
            />
            <Button
              title="Custom Location"
              onPress={() => Alert.alert('Feature Coming Soon', 'Custom location dispatch will be available soon.')}
              style={styles.modalActionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const FilterButton = ({ status, title, count, active, onPress }) => (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.activeFilterButton]}
      onPress={onPress}
    >
      <Text style={[
        styles.filterButtonText,
        active && styles.activeFilterButtonText
      ]}>
        {title} ({count})
      </Text>
    </TouchableOpacity>
  );

  const getFilterCounts = () => {
    return {
      all: ambulances.length,
      available: ambulances.filter(a => a.status === 'available').length,
      dispatched: ambulances.filter(a => a.status === 'dispatched').length,
      on_scene: ambulances.filter(a => a.status === 'on_scene').length
    };
  };

  const counts = getFilterCounts();
  const filteredAmbulances = filterStatus === 'all' 
    ? ambulances 
    : ambulances.filter(a => a.status === filterStatus);

  return (
    <SafeAreaView style={styles.container}>
      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{counts.available}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.WARNING }]}>{counts.dispatched}</Text>
          <Text style={styles.statLabel}>Dispatched</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.INFO }]}>{counts.on_scene}</Text>
          <Text style={styles.statLabel}>On Scene</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{counts.all}</Text>
          <Text style={styles.statLabel}>Total Units</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton
            status="all"
            title="All"
            count={counts.all}
            active={filterStatus === 'all'}
            onPress={() => setFilterStatus('all')}
          />
          <FilterButton
            status="available"
            title="Available"
            count={counts.available}
            active={filterStatus === 'available'}
            onPress={() => setFilterStatus('available')}
          />
          <FilterButton
            status="dispatched"
            title="Dispatched"
            count={counts.dispatched}
            active={filterStatus === 'dispatched'}
            onPress={() => setFilterStatus('dispatched')}
          />
          <FilterButton
            status="on_scene"
            title="On Scene"
            count={counts.on_scene}
            active={filterStatus === 'on_scene'}
            onPress={() => setFilterStatus('on_scene')}
          />
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Recent Dispatches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Dispatches</Text>
          {dispatches.slice(0, 3).map((dispatch) => (
            <DispatchCard key={dispatch.id} dispatch={dispatch} />
          ))}
        </View>

        {/* Ambulance Fleet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ambulance Fleet</Text>
          {filteredAmbulances.length === 0 ? (
            <Card style={styles.emptyState}>
              <Ionicons name="car-sport-outline" size={64} color={COLORS.GRAY_MEDIUM} />
              <Text style={styles.emptyTitle}>No Ambulances</Text>
              <Text style={styles.emptySubtitle}>No ambulances match the selected filter</Text>
            </Card>
          ) : (
            filteredAmbulances.map((ambulance) => (
              <AmbulanceCard key={ambulance.id} ambulance={ambulance} />
            ))
          )}
        </View>
      </ScrollView>

      <DispatchModal />
    </SafeAreaView>
  );
};

// Mock data
const mockAmbulances = [
  {
    id: 'AMB001',
    callSign: 'Ambulance 101',
    type: 'Advanced Life Support',
    status: 'available',
    currentLocation: 'Central Station',
    crew: ['Dr. Smith', 'Paramedic Jones'],
    equipment: ['Defibrillator', 'Oxygen', 'Stretcher', 'IV Kit'],
    fuelLevel: 85,
    totalCalls: 3,
    eta: '5 mins',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  {
    id: 'AMB002',
    callSign: 'Ambulance 102',
    type: 'Basic Life Support',
    status: 'dispatched',
    currentLocation: 'En route to Main St',
    crew: ['EMT Wilson', 'EMT Brown'],
    equipment: ['Basic First Aid', 'Oxygen', 'Stretcher'],
    fuelLevel: 70,
    totalCalls: 5,
    eta: '12 mins',
    coordinates: { lat: 40.7589, lng: -73.9851 },
    currentEmergency: 'EMG001'
  },
  {
    id: 'AMB003',
    callSign: 'Ambulance 103',
    type: 'Critical Care',
    status: 'on_scene',
    currentLocation: '456 Oak Avenue',
    crew: ['Dr. Davis', 'Nurse Taylor', 'Paramedic Lee'],
    equipment: ['Ventilator', 'Cardiac Monitor', 'Advanced Drugs'],
    fuelLevel: 60,
    totalCalls: 2,
    eta: 'On scene',
    coordinates: { lat: 40.7505, lng: -73.9934 },
    currentEmergency: 'EMG003'
  }
];

const mockDispatches = [
  {
    id: 'DISP001',
    ambulanceId: 'AMB002',
    emergencyId: 'EMG001',
    dispatchTime: new Date(Date.now() - 10 * 60000).toISOString(),
    status: 'en_route',
    estimatedArrival: new Date(Date.now() + 5 * 60000).toISOString()
  },
  {
    id: 'DISP002',
    ambulanceId: 'AMB003',
    emergencyId: 'EMG003',
    dispatchTime: new Date(Date.now() - 25 * 60000).toISOString(),
    status: 'on_scene',
    estimatedArrival: new Date(Date.now() - 5 * 60000).toISOString()
  }
];

const mockEmergencies = [
  {
    id: 'EMG001',
    location: '123 Main St, Downtown',
    type: 'Medical Emergency',
    priority: 'critical'
  },
  {
    id: 'EMG002',
    location: 'Highway 101, Mile 15',
    type: 'Traffic Accident',
    priority: 'high'
  },
  {
    id: 'EMG004',
    location: '789 Pine Street',
    type: 'Medical Emergency',
    priority: 'medium'
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  statsHeader: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  statNumber: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  statLabel: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  filterButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.XL,
    marginRight: SPACING.SM,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  activeFilterButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterButtonText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: COLORS.WHITE,
  },
  content: {
    flex: 1,
    padding: SPACING.MD,
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  ambulanceCard: {
    marginBottom: SPACING.MD,
    borderLeftWidth: 4,
  },
  ambulanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  ambulanceInfo: {
    flex: 1,
  },
  callSign: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  vehicleType: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  location: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.INFO,
    marginBottom: SPACING.XS / 2,
  },
  crew: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
  },
  ambulanceStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS / 2,
    borderRadius: BORDER_RADIUS.SM,
    marginBottom: SPACING.XS,
  },
  statusText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    marginLeft: SPACING.XS / 2,
    fontWeight: '600',
  },
  eta: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
  },
  ambulanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    marginBottom: SPACING.SM,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  ambulanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.SM,
    minWidth: 80,
  },
  actionText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    fontWeight: 'bold',
    marginLeft: SPACING.XS,
  },
  dispatchCard: {
    marginBottom: SPACING.SM,
    backgroundColor: COLORS.PRIMARY + '10',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  dispatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  dispatchId: {
    fontSize: FONT_SIZES.SM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  dispatchTime: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
  },
  dispatchDetails: {
    gap: SPACING.XS / 2,
  },
  dispatchAmbulance: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  dispatchStatus: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
  },
  dispatchEta: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.SUCCESS,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.MD,
    marginBottom: SPACING.XS,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  modalTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  modalBody: {
    marginBottom: SPACING.MD,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.MD,
  },
  emergencyList: {
    maxHeight: 300,
  },
  emergencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyId: {
    fontSize: FONT_SIZES.SM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  emergencyLocation: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  emergencyType: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalActionButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
});

export default AmbulanceDispatchScreen;