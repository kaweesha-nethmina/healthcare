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
  TextInput
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

const DoctorPrescriptionsScreen = ({ navigation, route }) => {
  const { userProfile } = useAuth();
  const { patientId, patientName, action } = route.params || {};
  
  const [prescriptions, setPrescriptions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('active'); // active, expired, all
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    loadPrescriptions();
    if (action === 'create') {
      setShowCreateModal(true);
    }
  }, []);

  const loadPrescriptions = async () => {
    try {
      // Fetch prescriptions from Firebase
      let prescriptionsQuery = collection(db, 'prescriptions');
      
      // Filter by doctor if available
      if (userProfile?.uid) {
        prescriptionsQuery = query(
          prescriptionsQuery,
          where('doctorId', '==', userProfile.uid)
        );
      }
      
      // Filter by patient if specified
      if (patientId) {
        prescriptionsQuery = query(
          prescriptionsQuery,
          where('patientId', '==', patientId)
        );
      }
      
      // Order by creation date
      prescriptionsQuery = query(
        prescriptionsQuery,
      );
      
      const prescriptionsSnapshot = await getDocs(prescriptionsQuery);
      const prescriptionsData = [];
      
      prescriptionsSnapshot.forEach((doc) => {
        prescriptionsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort in memory instead of using Firestore orderBy
      prescriptionsData.sort((a, b) => {
        const dateA = a.createdAt ? (typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate() : a.createdAt) : new Date(0);
        const dateB = b.createdAt ? (typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate() : b.createdAt) : new Date(0);
        return new Date(dateB) - new Date(dateA);
      });
      
      setPrescriptions(prescriptionsData);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrescriptions();
    setRefreshing(false);
  };

  const getPrescriptionStatus = (prescription) => {
    const now = new Date();
    const endDate = new Date(prescription.endDate);
    
    if (endDate < now) return 'expired';
    if (prescription.refillsRemaining <= 0) return 'no-refills';
    return 'active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return COLORS.SUCCESS;
      case 'expired':
        return COLORS.ERROR;
      case 'no-refills':
        return COLORS.WARNING;
      default:
        return COLORS.GRAY_MEDIUM;
    }
  };

  const createPrescription = async (prescriptionData) => {
    try {
      const newPrescription = {
        patientId: patientId || 'patient_1',
        patientName: patientName || 'Selected Patient',
        doctorId: userProfile?.uid || 'doctor_1',
        doctorName: `Dr. ${userProfile?.firstName} ${userProfile?.lastName}`,
        ...prescriptionData,
        createdAt: serverTimestamp(),
        refillsRemaining: prescriptionData.refills || 0
      };

      // Save to Firebase
      const docRef = await addDoc(collection(db, 'prescriptions'), newPrescription);
      
      // Add to local state
      const prescriptionWithId = {
        id: docRef.id,
        ...newPrescription
      };
      
      setPrescriptions(prev => [prescriptionWithId, ...prev]);
      setShowCreateModal(false);
      Alert.alert('Success', 'Prescription created successfully');
    } catch (error) {
      console.error('Error creating prescription:', error);
      Alert.alert('Error', 'Failed to create prescription');
    }
  };

  const updatePrescription = async (updatedData) => {
    try {
      // Update in Firebase
      const prescriptionRef = doc(db, 'prescriptions', selectedPrescription.id);
      await updateDoc(prescriptionRef, updatedData);
      
      // Update local state
      const updated = prescriptions.map(p =>
        p.id === selectedPrescription.id ? { ...p, ...updatedData } : p
      );
      setPrescriptions(updated);
      setShowEditModal(false);
      Alert.alert('Success', 'Prescription updated successfully');
    } catch (error) {
      console.error('Error updating prescription:', error);
      Alert.alert('Error', 'Failed to update prescription');
    }
  };

  const handlePrescriptionAction = (prescription, action) => {
    switch (action) {
      case 'edit':
        setSelectedPrescription(prescription);
        setShowEditModal(true);
        break;
      case 'refill':
        Alert.alert(
          'Authorize Refill',
          `Authorize refill for ${prescription.medicationName}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Authorize',
              onPress: () => {
                if (prescription.refillsRemaining > 0) {
                  const updated = prescriptions.map(p =>
                    p.id === prescription.id 
                      ? { ...p, refillsRemaining: p.refillsRemaining - 1 }
                      : p
                  );
                  setPrescriptions(updated);
                  Alert.alert('Success', 'Refill authorized');
                } else {
                  Alert.alert('Error', 'No refills remaining. Create new prescription.');
                }
              }
            }
          ]
        );
        break;
      case 'renew':
        setSelectedPrescription(prescription);
        setShowCreateModal(true);
        break;
      case 'discontinue':
        Alert.alert(
          'Discontinue Prescription',
          `Discontinue ${prescription.medicationName}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Discontinue',
              style: 'destructive',
              onPress: () => {
                const updated = prescriptions.map(p =>
                  p.id === prescription.id 
                    ? { ...p, endDate: new Date().toISOString() }
                    : p
                );
                setPrescriptions(updated);
                Alert.alert('Success', 'Prescription discontinued');
              }
            }
          ]
        );
        break;
      default:
        break;
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const status = getPrescriptionStatus(prescription);
    if (filterStatus === 'all') return true;
    return status === filterStatus;
  });

  const FilterButton = ({ status, title, active, onPress }) => (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.activeFilterButton]}
      onPress={onPress}
    >
      <Text style={[
        styles.filterButtonText,
        active && styles.activeFilterButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const PrescriptionCard = ({ prescription }) => {
    const status = getPrescriptionStatus(prescription);
    const statusColor = getStatusColor(status);

    return (
      <Card style={styles.prescriptionCard}>
        <View style={styles.prescriptionHeader}>
          <View style={styles.medicationInfo}>
            <View style={[styles.medicationIcon, { backgroundColor: statusColor }]}>
              <Ionicons name="medical" size={20} color={COLORS.WHITE} />
            </View>
            <View style={styles.prescriptionDetails}>
              <Text style={styles.medicationName}>{prescription.medicationName}</Text>
              <Text style={styles.patientName}>{prescription.patientName}</Text>
              <Text style={styles.prescriptionMeta}>
                {prescription.dosage} • {prescription.frequency}
              </Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>
                {status.charAt(0).toUpperCase() + status.replace('-', ' ').slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.prescriptionInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Instructions:</Text>
            <Text style={styles.infoValue}>{prescription.instructions}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>
              {new Date(prescription.startDate).toLocaleDateString()} - {new Date(prescription.endDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Refills Remaining:</Text>
            <Text style={styles.infoValue}>{prescription.refillsRemaining}</Text>
          </View>
        </View>

        <View style={styles.prescriptionActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePrescriptionAction(prescription, 'edit')}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.PRIMARY} />
            <Text style={[styles.actionText, { color: COLORS.PRIMARY }]}>Edit</Text>
          </TouchableOpacity>

          {status === 'active' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handlePrescriptionAction(prescription, 'refill')}
              >
                <Ionicons name="refresh-outline" size={18} color={COLORS.SUCCESS} />
                <Text style={[styles.actionText, { color: COLORS.SUCCESS }]}>Refill</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handlePrescriptionAction(prescription, 'discontinue')}
              >
                <Ionicons name="stop-outline" size={18} color={COLORS.ERROR} />
                <Text style={[styles.actionText, { color: COLORS.ERROR }]}>Stop</Text>
              </TouchableOpacity>
            </>
          )}

          {(status === 'expired' || status === 'no-refills') && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePrescriptionAction(prescription, 'renew')}
            >
              <Ionicons name="add-outline" size={18} color={COLORS.INFO} />
              <Text style={[styles.actionText, { color: COLORS.INFO }]}>Renew</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  const CreatePrescriptionModal = () => {
    const [formData, setFormData] = useState({
      medicationName: selectedPrescription?.medicationName || '',
      dosage: selectedPrescription?.dosage || '',
      frequency: selectedPrescription?.frequency || '',
      instructions: selectedPrescription?.instructions || '',
      startDate: new Date().toISOString().split('T')[0],
      duration: '30', // days
      refills: '2'
    });

    const handleSubmit = () => {
      if (!formData.medicationName || !formData.dosage || !formData.frequency) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(formData.duration));

      createPrescription({
        ...formData,
        endDate: endDate.toISOString(),
        refills: parseInt(formData.refills)
      });
    };

    return (
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedPrescription ? 'Renew Prescription' : 'Create Prescription'}
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            {patientName && (
              <Text style={styles.modalSubtitle}>Patient: {patientName}</Text>
            )}

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Medication Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.medicationName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, medicationName: text }))}
                  placeholder="Enter medication name"
                  placeholderTextColor={COLORS.GRAY_MEDIUM}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.SM }]}>
                  <Text style={styles.inputLabel}>Dosage *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.dosage}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, dosage: text }))}
                    placeholder="e.g., 10mg"
                    placeholderTextColor={COLORS.GRAY_MEDIUM}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.SM }]}>
                  <Text style={styles.inputLabel}>Frequency *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.frequency}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, frequency: text }))}
                    placeholder="e.g., Twice daily"
                    placeholderTextColor={COLORS.GRAY_MEDIUM}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Instructions</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.instructions}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, instructions: text }))}
                  placeholder="Special instructions for the patient"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={COLORS.GRAY_MEDIUM}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.SM }]}>
                  <Text style={styles.inputLabel}>Duration (days)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.duration}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
                    placeholder="30"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.GRAY_MEDIUM}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.SM }]}>
                  <Text style={styles.inputLabel}>Refills</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.refills}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, refills: text }))}
                    placeholder="2"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.GRAY_MEDIUM}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowCreateModal(false)}
                style={styles.modalActionButton}
                variant="outline"
              />
              <Button
                title={selectedPrescription ? 'Renew' : 'Create'}
                onPress={handleSubmit}
                style={styles.modalActionButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const getStatusCounts = () => {
    return {
      active: prescriptions.filter(p => getPrescriptionStatus(p) === 'active').length,
      expired: prescriptions.filter(p => getPrescriptionStatus(p) === 'expired').length,
      all: prescriptions.length
    };
  };

  const counts = getStatusCounts();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {patientName && (
        <View style={styles.patientHeader}>
          <Text style={styles.patientHeaderText}>Prescriptions for {patientName}</Text>
        </View>
      )}

      {/* Stats Header */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{counts.all}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{counts.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.ERROR }]}>{counts.expired}</Text>
          <Text style={styles.statLabel}>Expired</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton
            status="active"
            title="Active"
            active={filterStatus === 'active'}
            onPress={() => setFilterStatus('active')}
          />
          <FilterButton
            status="expired"
            title="Expired"
            active={filterStatus === 'expired'}
            onPress={() => setFilterStatus('expired')}
          />
          <FilterButton
            status="all"
            title="All"
            active={filterStatus === 'all'}
            onPress={() => setFilterStatus('all')}
          />
        </ScrollView>
      </View>

      {/* Prescriptions List */}
      <ScrollView
        style={styles.prescriptionsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredPrescriptions.length === 0 ? (
          <Card style={styles.emptyState}>
            <Ionicons name="medical-outline" size={64} color={COLORS.GRAY_MEDIUM} />
            <Text style={styles.emptyTitle}>No Prescriptions</Text>
            <Text style={styles.emptySubtitle}>
              {filterStatus === 'all' 
                ? 'No prescriptions found.'
                : `No ${filterStatus} prescriptions.`
              }
            </Text>
            <Button
              title="Create Prescription"
              onPress={() => setShowCreateModal(true)}
              style={styles.emptyButton}
            />
          </Card>
        ) : (
          filteredPrescriptions.map((prescription) => (
            <PrescriptionCard key={prescription.id} prescription={prescription} />
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={24} color={COLORS.WHITE} />
      </TouchableOpacity>

      <CreatePrescriptionModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  patientHeader: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  patientHeaderText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.WHITE,
    textAlign: 'center',
  },
  statsContainer: {
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
    alignItems: 'center',
    flex: 1,
  },
  medicationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  prescriptionDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  patientName: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS / 2,
    fontWeight: '600',
  },
  prescriptionMeta: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS / 2,
    borderRadius: BORDER_RADIUS.SM,
  },
  statusText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  prescriptionInfo: {
    marginBottom: SPACING.MD,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SPACING.XS,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  infoLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
    width: '30%',
  },
  infoValue: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    textAlign: 'right',
  },
  prescriptionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.SM,
  },
  actionText: {
    fontSize: FONT_SIZES.XS,
    marginTop: SPACING.XS / 2,
    fontWeight: '500',
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
    marginBottom: SPACING.LG,
  },
  emptyButton: {
    paddingHorizontal: SPACING.XL,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.LG,
    right: SPACING.LG,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  modalTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.MD,
    textAlign: 'center',
    fontWeight: '600',
  },
  formContainer: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: SPACING.MD,
  },
  inputRow: {
    flexDirection: 'row',
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.MD,
  },
  modalActionButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
});

export default DoctorPrescriptionsScreen;