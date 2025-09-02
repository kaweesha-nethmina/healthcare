import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS
} from '../constants';
import Card from '../components/Card';
import Button from '../components/Button';

const PrescriptionScreen = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [filterType, setFilterType] = useState('all'); // all, active, completed, expired
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({});

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      // In a real app, fetch from Firebase
      // For now, using mock data
      setPrescriptions(mockPrescriptions);
      
      // Initialize reminder settings
      const reminders = {};
      mockPrescriptions.forEach(prescription => {
        reminders[prescription.id] = prescription.reminderEnabled || false;
      });
      setReminderSettings(reminders);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      setPrescriptions(mockPrescriptions);
    }
  };

  const toggleReminder = async (prescriptionId) => {
    const newSettings = {
      ...reminderSettings,
      [prescriptionId]: !reminderSettings[prescriptionId]
    };
    setReminderSettings(newSettings);
    
    // Update prescription in database
    setPrescriptions(prev =>
      prev.map(p =>
        p.id === prescriptionId
          ? { ...p, reminderEnabled: newSettings[prescriptionId] }
          : p
      )
    );
    
    Alert.alert(
      'Reminder Updated',
      `Medication reminder ${newSettings[prescriptionId] ? 'enabled' : 'disabled'}`
    );
  };

  const markAsTaken = (prescriptionId, doseTime) => {
    Alert.alert(
      'Mark as Taken',
      'Did you take your medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            // Update local state
            setPrescriptions(prev =>
              prev.map(p => {
                if (p.id === prescriptionId) {
                  const updatedDoses = [...p.doseTimes];
                  const doseIndex = updatedDoses.findIndex(d => d.time === doseTime);
                  if (doseIndex !== -1) {
                    updatedDoses[doseIndex] = { ...updatedDoses[doseIndex], taken: true };
                  }
                  return { ...p, doseTimes: updatedDoses };
                }
                return p;
              })
            );
            Alert.alert('Success', 'Medication marked as taken');
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return COLORS.SUCCESS;
      case 'completed': return COLORS.PRIMARY;
      case 'expired': return COLORS.ERROR;
      case 'paused': return COLORS.WARNING;
      default: return COLORS.GRAY_MEDIUM;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'checkmark-circle';
      case 'completed': return 'checkmark-done-circle';
      case 'expired': return 'close-circle';
      case 'paused': return 'pause-circle';
      default: return 'help-circle';
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    if (filterType === 'all') return true;
    return prescription.status === filterType;
  });

  const FilterButton = ({ type, title, count, active, onPress }) => (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.activeFilterButton]}
      onPress={onPress}
    >
      <Text style={[
        styles.filterButtonText,
        active && styles.activeFilterButtonText
      ]}>
        {title} {count > 0 && `(${count})`}
      </Text>
    </TouchableOpacity>
  );

  const PrescriptionCard = ({ prescription }) => (
    <Card style={styles.prescriptionCard}>
      <TouchableOpacity
        onPress={() => {
          setSelectedPrescription(prescription);
          setDetailModalVisible(true);
        }}
      >
        <View style={styles.prescriptionHeader}>
          <View style={styles.medicationInfo}>
            <View style={styles.medicationIcon}>
              <Ionicons name="medical" size={24} color={COLORS.WHITE} />
            </View>
            <View style={styles.medicationDetails}>
              <Text style={styles.medicationName}>{prescription.medicationName}</Text>
              <Text style={styles.medicationDosage}>
                {prescription.dosage} • {prescription.frequency}
              </Text>
              <Text style={styles.prescribedBy}>Prescribed by {prescription.doctorName}</Text>
            </View>
          </View>
          <View style={styles.prescriptionStatus}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(prescription.status) }]}>
              <Ionicons 
                name={getStatusIcon(prescription.status)} 
                size={16} 
                color={COLORS.WHITE} 
              />
              <Text style={styles.statusText}>{prescription.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.prescriptionMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.metaText}>
              {prescription.startDate} - {prescription.endDate}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.metaText}>
              Next: {prescription.nextDose || 'N/A'}
            </Text>
          </View>
        </View>

        {prescription.status === 'active' && (
          <View style={styles.todayDoses}>
            <Text style={styles.dosesTitle}>Today's Doses</Text>
            <View style={styles.dosesContainer}>
              {prescription.doseTimes?.map((dose, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.doseButton, dose.taken && styles.doseTaken]}
                  onPress={() => !dose.taken && markAsTaken(prescription.id, dose.time)}
                >
                  <Text style={[styles.doseTime, dose.taken && styles.doseTimeTaken]}>
                    {dose.time}
                  </Text>
                  {dose.taken && (
                    <Ionicons name="checkmark" size={16} color={COLORS.WHITE} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.prescriptionActions}>
          <View style={styles.reminderToggle}>
            <Text style={styles.reminderText}>Reminders</Text>
            <Switch
              value={reminderSettings[prescription.id] || false}
              onValueChange={() => toggleReminder(prescription.id)}
              trackColor={{ false: COLORS.GRAY_LIGHT, true: COLORS.PRIMARY }}
              thumbColor={COLORS.WHITE}
            />
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.PRIMARY} />
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Card>
  );

  const PrescriptionDetailModal = () => (
    <Modal
      visible={isDetailModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setDetailModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Prescription Details</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setDetailModalVisible(false)}
          >
            <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>
        
        {selectedPrescription && (
          <ScrollView style={styles.modalContent}>
            <Card style={styles.detailCard}>
              <Text style={styles.detailMedicationName}>
                {selectedPrescription.medicationName}
              </Text>
              <Text style={styles.detailDosage}>{selectedPrescription.dosage}</Text>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Instructions</Text>
                <Text style={styles.detailText}>{selectedPrescription.instructions}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Frequency</Text>
                <Text style={styles.detailText}>{selectedPrescription.frequency}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Duration</Text>
                <Text style={styles.detailText}>
                  {selectedPrescription.startDate} to {selectedPrescription.endDate}
                </Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Prescribed By</Text>
                <Text style={styles.detailText}>
                  {selectedPrescription.doctorName}
                </Text>
                <Text style={styles.detailSubtext}>
                  {selectedPrescription.prescriptionDate}
                </Text>
              </View>
              
              {selectedPrescription.sideEffects && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Possible Side Effects</Text>
                  <Text style={styles.detailText}>{selectedPrescription.sideEffects}</Text>
                </View>
              )}
              
              {selectedPrescription.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Additional Notes</Text>
                  <Text style={styles.detailText}>{selectedPrescription.notes}</Text>
                </View>
              )}
            </Card>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const getFilterCounts = () => ({
    all: prescriptions.length,
    active: prescriptions.filter(p => p.status === 'active').length,
    completed: prescriptions.filter(p => p.status === 'completed').length,
    expired: prescriptions.filter(p => p.status === 'expired').length,
  });

  const filterCounts = getFilterCounts();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Prescriptions</Text>
        <Text style={styles.subtitle}>Manage your medications</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton
            type="all"
            title="All"
            count={filterCounts.all}
            active={filterType === 'all'}
            onPress={() => setFilterType('all')}
          />
          <FilterButton
            type="active"
            title="Active"
            count={filterCounts.active}
            active={filterType === 'active'}
            onPress={() => setFilterType('active')}
          />
          <FilterButton
            type="completed"
            title="Completed"
            count={filterCounts.completed}
            active={filterType === 'completed'}
            onPress={() => setFilterType('completed')}
          />
          <FilterButton
            type="expired"
            title="Expired"
            count={filterCounts.expired}
            active={filterType === 'expired'}
            onPress={() => setFilterType('expired')}
          />
        </ScrollView>
      </View>

      {/* Prescriptions List */}
      <ScrollView style={styles.prescriptionsList} showsVerticalScrollIndicator={false}>
        {filteredPrescriptions.length === 0 ? (
          <Card style={styles.emptyState}>
            <Ionicons name="medical-outline" size={64} color={COLORS.GRAY_MEDIUM} />
            <Text style={styles.emptyTitle}>No Prescriptions</Text>
            <Text style={styles.emptySubtitle}>
              {filterType === 'all' 
                ? 'Your prescriptions will appear here when doctors prescribe medications.'
                : `No ${filterType} prescriptions to display.`
              }
            </Text>
            <Button
              title="Book Appointment"
              onPress={() => navigation.navigate('Consultation')}
              style={styles.emptyButton}
            />
          </Card>
        ) : (
          filteredPrescriptions.map((prescription) => (
            <PrescriptionCard key={prescription.id} prescription={prescription} />
          ))
        )}
      </ScrollView>

      <PrescriptionDetailModal />
    </SafeAreaView>
  );
};

// Mock prescriptions data
const mockPrescriptions = [
  {
    id: '1',
    medicationName: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    instructions: 'Take with or without food. Best taken in the morning.',
    startDate: '2024-03-01',
    endDate: '2024-06-01',
    status: 'active',
    doctorName: 'Dr. Sarah Johnson',
    prescriptionDate: '2024-03-01',
    nextDose: 'Tomorrow 8:00 AM',
    reminderEnabled: true,
    doseTimes: [
      { time: '8:00 AM', taken: true },
    ],
    sideEffects: 'Dizziness, dry cough, headache',
    notes: 'Monitor blood pressure weekly'
  },
  {
    id: '2',
    medicationName: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily with meals',
    instructions: 'Take with breakfast and dinner to reduce stomach upset.',
    startDate: '2024-02-15',
    endDate: '2024-05-15',
    status: 'active',
    doctorName: 'Dr. Michael Chen',
    prescriptionDate: '2024-02-15',
    nextDose: 'Today 6:00 PM',
    reminderEnabled: false,
    doseTimes: [
      { time: '8:00 AM', taken: true },
      { time: '6:00 PM', taken: false },
    ],
    sideEffects: 'Nausea, diarrhea, metallic taste',
    notes: 'Check blood sugar levels regularly'
  },
  {
    id: '3',
    medicationName: 'Amoxicillin',
    dosage: '250mg',
    frequency: 'Three times daily',
    instructions: 'Complete the full course even if feeling better.',
    startDate: '2024-02-01',
    endDate: '2024-02-10',
    status: 'completed',
    doctorName: 'Dr. Emily Rodriguez',
    prescriptionDate: '2024-02-01',
    nextDose: null,
    reminderEnabled: false,
    doseTimes: [],
    sideEffects: 'Nausea, diarrhea, skin rash',
    notes: 'Antibiotic for respiratory infection'
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
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
  prescriptionsList: {
    flex: 1,
    padding: SPACING.MD,
  },
  prescriptionCard: {
    marginBottom: SPACING.MD,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  medicationInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  medicationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  medicationDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  medicationDosage: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS / 2,
  },
  prescribedBy: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  prescriptionStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS / 2,
    borderRadius: BORDER_RADIUS.SM,
  },
  statusText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    fontWeight: '600',
    marginLeft: SPACING.XS / 2,
    textTransform: 'uppercase',
  },
  prescriptionMeta: {
    marginBottom: SPACING.MD,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS / 2,
  },
  metaText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
  },
  todayDoses: {
    marginBottom: SPACING.MD,
  },
  dosesTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  dosesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  doseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    marginRight: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  doseTaken: {
    backgroundColor: COLORS.SUCCESS,
    borderColor: COLORS.SUCCESS,
  },
  doseTime: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  doseTimeTaken: {
    color: COLORS.WHITE,
    marginRight: SPACING.XS / 2,
  },
  prescriptionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    marginRight: SPACING.SM,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    marginLeft: SPACING.XS / 2,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
    marginTop: SPACING.XL,
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
    marginBottom: SPACING.LG,
    paddingHorizontal: SPACING.LG,
  },
  emptyButton: {
    paddingHorizontal: SPACING.XL,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  modalTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    padding: SPACING.XS,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.MD,
  },
  detailCard: {
    marginBottom: SPACING.MD,
  },
  detailMedicationName: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  detailDosage: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.LG,
  },
  detailSection: {
    marginBottom: SPACING.LG,
  },
  detailSectionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  detailText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
  },
  detailSubtext: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS / 2,
  },
});

export default PrescriptionScreen;