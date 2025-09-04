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
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
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
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    instructions: '',
    startDate: '',
    endDate: '',
    refills: ''
  });
  const [reminderSettings, setReminderSettings] = useState({});

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      // Fetch prescriptions from Firebase
      if (user && user.uid) {
        const prescriptionsQuery = query(
          collection(db, 'prescriptions'),
          where('patientId', '==', user.uid)
          // Removed orderBy('createdAt', 'desc') to avoid composite index
        );
        
        const prescriptionsSnapshot = await getDocs(prescriptionsQuery);
        const prescriptionsData = [];
        const reminders = {};
        
        prescriptionsSnapshot.forEach((doc) => {
          const prescription = {
            id: doc.id,
            ...doc.data()
          };
          prescriptionsData.push(prescription);
          
          // Initialize reminder settings
          reminders[prescription.id] = prescription.reminderEnabled || false;
        });
        
        // Sort in memory instead of using Firestore orderBy
        prescriptionsData.sort((a, b) => {
          const dateA = a.createdAt ? (typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate() : a.createdAt) : new Date(0);
          const dateB = b.createdAt ? (typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate() : b.createdAt) : new Date(0);
          return new Date(dateB) - new Date(dateA);
        });
        
        setPrescriptions(prescriptionsData);
        setReminderSettings(reminders);
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    }
  };

  const toggleReminder = async (prescriptionId) => {
    const newSettings = {
      ...reminderSettings,
      [prescriptionId]: !reminderSettings[prescriptionId]
    };
    setReminderSettings(newSettings);
    
    // Update prescription in database
    try {
      await updateDoc(doc(db, 'prescriptions', prescriptionId), {
        reminderEnabled: newSettings[prescriptionId]
      });
      
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
    } catch (error) {
      console.error('Error updating reminder:', error);
      Alert.alert('Error', 'Failed to update reminder settings');
    }
  };

  const markAsTaken = (prescriptionId, doseTime) => {
    Alert.alert(
      'Mark as Taken',
      'Did you take your medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              // Update in database
              const prescriptionRef = doc(db, 'prescriptions', prescriptionId);
              const prescriptionDoc = await getDoc(prescriptionRef);
              
              if (prescriptionDoc.exists()) {
                const prescriptionData = prescriptionDoc.data();
                const updatedDoses = [...(prescriptionData.doseTimes || [])];
                const doseIndex = updatedDoses.findIndex(d => d.time === doseTime);
                
                if (doseIndex !== -1) {
                  updatedDoses[doseIndex] = { ...updatedDoses[doseIndex], taken: true };
                  
                  await updateDoc(prescriptionRef, {
                    doseTimes: updatedDoses
                  });
                  
                  // Update local state
                  setPrescriptions(prev =>
                    prev.map(p => {
                      if (p.id === prescriptionId) {
                        return { ...p, doseTimes: updatedDoses };
                      }
                      return p;
                    })
                  );
                  
                  Alert.alert('Success', 'Medication marked as taken');
                }
              }
            } catch (error) {
              console.error('Error marking as taken:', error);
              Alert.alert('Error', 'Failed to mark medication as taken');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (prescription) => {
    setSelectedPrescription(prescription);
    setEditFormData({
      medicationName: prescription.medicationName || '',
      dosage: prescription.dosage || '',
      frequency: prescription.frequency || '',
      instructions: prescription.instructions || '',
      startDate: prescription.startDate || '',
      endDate: prescription.endDate || '',
      refills: prescription.refills?.toString() || '0'
    });
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      // Check if prescription is expired
      const endDate = new Date(editFormData.endDate);
      const now = new Date();
      
      if (endDate < now) {
        Alert.alert('Error', 'Cannot edit expired prescriptions');
        return;
      }
      
      // Update prescription in database
      await updateDoc(doc(db, 'prescriptions', selectedPrescription.id), {
        medicationName: editFormData.medicationName,
        dosage: editFormData.dosage,
        frequency: editFormData.frequency,
        instructions: editFormData.instructions,
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
        refills: parseInt(editFormData.refills),
        refillsRemaining: parseInt(editFormData.refills)
      });
      
      // Update local state
      setPrescriptions(prev =>
        prev.map(p => {
          if (p.id === selectedPrescription.id) {
            return {
              ...p,
              medicationName: editFormData.medicationName,
              dosage: editFormData.dosage,
              frequency: editFormData.frequency,
              instructions: editFormData.instructions,
              startDate: editFormData.startDate,
              endDate: editFormData.endDate,
              refills: parseInt(editFormData.refills),
              refillsRemaining: parseInt(editFormData.refills)
            };
          }
          return p;
        })
      );
      
      setIsEditModalVisible(false);
      setDetailModalVisible(false);
      Alert.alert('Success', 'Prescription updated successfully');
    } catch (error) {
      console.error('Error updating prescription:', error);
      Alert.alert('Error', 'Failed to update prescription');
    }
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
              
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Refills</Text>
                <Text style={styles.detailText}>
                  {selectedPrescription.refillsRemaining} of {selectedPrescription.refills} refills remaining
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
              
              {/* Show edit button only for doctors and if prescription is not expired */}
              {userProfile?.role === 'doctor' && new Date(selectedPrescription.endDate) > new Date() && (
                <View style={styles.editButtonContainer}>
                  <Button
                    title="Edit Prescription"
                    onPress={() => {
                      setDetailModalVisible(false);
                      openEditModal(selectedPrescription);
                    }}
                    style={styles.editButton}
                  />
                </View>
              )}
            </Card>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const EditPrescriptionModal = () => (
    <Modal
      visible={isEditModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsEditModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Prescription</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsEditModalVisible(false)}
          >
            <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Card style={styles.detailCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Medication Name</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.medicationName}
                onChangeText={(text) => setEditFormData({...editFormData, medicationName: text})}
                placeholder="Enter medication name"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dosage</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.dosage}
                onChangeText={(text) => setEditFormData({...editFormData, dosage: text})}
                placeholder="e.g., 10mg"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Frequency</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.frequency}
                onChangeText={(text) => setEditFormData({...editFormData, frequency: text})}
                placeholder="e.g., Twice daily"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Instructions</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editFormData.instructions}
                onChangeText={(text) => setEditFormData({...editFormData, instructions: text})}
                placeholder="Special instructions"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.SM }]}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={editFormData.startDate}
                  onChangeText={(text) => setEditFormData({...editFormData, startDate: text})}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.SM }]}>
                <Text style={styles.inputLabel}>End Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={editFormData.endDate}
                  onChangeText={(text) => setEditFormData({...editFormData, endDate: text})}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Refills</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.refills}
                onChangeText={(text) => setEditFormData({...editFormData, refills: text})}
                placeholder="Number of refills"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={() => setIsEditModalVisible(false)}
                variant="outline"
                style={styles.cancelButton}
              />
              <Button
                title="Save Changes"
                onPress={handleEditSubmit}
                style={styles.saveButton}
              />
            </View>
          </Card>
        </ScrollView>
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
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredPrescriptions.length === 0 ? (
          <Card style={styles.emptyState}>
            <Ionicons name="medical-outline" size={64} color={COLORS.GRAY_MEDIUM} />
            <Text style={styles.emptyTitle}>No Prescriptions</Text>
            <Text style={styles.emptySubtitle}>
              {filterType === 'all' 
                ? 'You have no prescriptions yet'
                : `No ${filterType} prescriptions found`
              }
            </Text>
          </Card>
        ) : (
          filteredPrescriptions.map((prescription) => (
            <PrescriptionCard key={prescription.id} prescription={prescription} />
          ))
        )}
      </ScrollView>

      <PrescriptionDetailModal />
      <EditPrescriptionModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.LG,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: FONT_SIZES.XL,
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
  content: {
    flex: 1,
    padding: SPACING.MD,
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
    paddingHorizontal: SPACING.MD,
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
    alignItems: 'center',
    flex: 1,
  },
  medicationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  medicationDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  medicationDosage: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS / 2,
  },
  prescribedBy: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
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
    backgroundColor: COLORS.SUCCESS,
  },
  statusText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    fontWeight: '600',
    marginLeft: SPACING.XS / 2,
  },
  prescriptionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.MD,
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
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  dosesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  doseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    backgroundColor: COLORS.GRAY_LIGHT,
    marginRight: SPACING.XS,
    marginBottom: SPACING.XS,
  },
  doseTaken: {
    backgroundColor: COLORS.SUCCESS,
  },
  doseTime: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    marginRight: SPACING.XS / 2,
  },
  doseTimeTaken: {
    color: COLORS.WHITE,
  },
  prescriptionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingTop: SPACING.MD,
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    marginRight: SPACING.SM,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginLeft: SPACING.XS,
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
    paddingVertical: SPACING.LG,
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
    padding: SPACING.SM,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.MD,
  },
  detailCard: {
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
  },
  detailMedicationName: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  detailDosage: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.LG,
  },
  detailSection: {
    marginBottom: SPACING.MD,
  },
  detailSectionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  detailText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  detailSubtext: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.GRAY_MEDIUM,
    marginTop: SPACING.XS,
  },
  editButtonContainer: {
    marginTop: SPACING.LG,
    alignItems: 'center',
  },
  editButton: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: SPACING.MD,
  },
  inputLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    marginBottom: SPACING.XS,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: COLORS.WHITE,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: SPACING.MD,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.LG,
  },
  cancelButton: {
    flex: 1,
    marginRight: SPACING.SM,
  },
  saveButton: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
});

export default PrescriptionScreen;
