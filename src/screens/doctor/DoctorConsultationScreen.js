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
  Modal
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

const DoctorConsultationScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('active'); // active, scheduled, completed, all
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      // In a real app, fetch from Firebase
      // For now, using mock data
      setConsultations(mockConsultations);
    } catch (error) {
      console.error('Error loading consultations:', error);
      setConsultations(mockConsultations);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConsultations();
    setRefreshing(false);
  };

  const getConsultationTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return 'videocam';
      case 'audio':
        return 'call';
      case 'chat':
        return 'chatbubble';
      default:
        return 'medical';
    }
  };

  const getConsultationTypeColor = (type) => {
    switch (type) {
      case 'video':
        return COLORS.PRIMARY;
      case 'audio':
        return COLORS.SUCCESS;
      case 'chat':
        return COLORS.INFO;
      default:
        return COLORS.GRAY_MEDIUM;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return COLORS.SUCCESS;
      case 'scheduled':
        return COLORS.WARNING;
      case 'completed':
        return COLORS.INFO;
      case 'cancelled':
        return COLORS.ERROR;
      default:
        return COLORS.GRAY_MEDIUM;
    }
  };

  const handleConsultationAction = (consultation, action) => {
    switch (action) {
      case 'join':
        if (consultation.type === 'video') {
          navigation.navigate('VideoCall', {
            consultationId: consultation.id,
            patientId: consultation.patientId,
            patientName: consultation.patientName
          });
        } else if (consultation.type === 'chat') {
          navigation.navigate('Chat', {
            patientId: consultation.patientId,
            patientName: consultation.patientName
          });
        } else {
          Alert.alert('Audio Call', `Starting audio call with ${consultation.patientName}...`);
        }
        break;
      case 'reschedule':
        Alert.alert(
          'Reschedule Consultation',
          `Reschedule consultation with ${consultation.patientName}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reschedule', onPress: () => Alert.alert('Success', 'Reschedule request sent to patient') }
          ]
        );
        break;
      case 'cancel':
        Alert.alert(
          'Cancel Consultation',
          `Cancel consultation with ${consultation.patientName}?`,
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Yes, Cancel',
              style: 'destructive',
              onPress: () => {
                const updated = consultations.map(c =>
                  c.id === consultation.id ? { ...c, status: 'cancelled' } : c
                );
                setConsultations(updated);
              }
            }
          ]
        );
        break;
      case 'complete':
        setSelectedConsultation(consultation);
        setShowConsultationModal(true);
        break;
      default:
        break;
    }
  };

  const completeConsultation = (notes, prescription) => {
    const updated = consultations.map(c =>
      c.id === selectedConsultation.id 
        ? { ...c, status: 'completed', notes, prescription } 
        : c
    );
    setConsultations(updated);
    setShowConsultationModal(false);
    Alert.alert('Success', 'Consultation completed successfully');
  };

  const filteredConsultations = consultations.filter(consultation => {
    if (filterStatus === 'all') return true;
    return consultation.status === filterStatus;
  });

  const isConsultationTime = (dateTime) => {
    const now = new Date();
    const consultationTime = new Date(dateTime);
    const timeDiff = consultationTime.getTime() - now.getTime();
    return timeDiff <= 15 * 60 * 1000 && timeDiff >= -15 * 60 * 1000; // Within 15 minutes
  };

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

  const ConsultationCard = ({ consultation }) => {
    const canJoin = consultation.status === 'active' || 
                   (consultation.status === 'scheduled' && isConsultationTime(consultation.scheduledTime));
    const canReschedule = consultation.status === 'scheduled';
    const canCancel = ['scheduled', 'active'].includes(consultation.status);
    const canComplete = consultation.status === 'active';

    return (
      <Card style={styles.consultationCard}>
        <View style={styles.consultationHeader}>
          <View style={styles.patientInfo}>
            <View style={[
              styles.typeIcon, 
              { backgroundColor: getConsultationTypeColor(consultation.type) }
            ]}>
              <Ionicons 
                name={getConsultationTypeIcon(consultation.type)} 
                size={20} 
                color={COLORS.WHITE} 
              />
            </View>
            <View style={styles.consultationDetails}>
              <Text style={styles.patientName}>{consultation.patientName}</Text>
              <Text style={styles.consultationType}>
                {consultation.type.charAt(0).toUpperCase() + consultation.type.slice(1)} Consultation
              </Text>
              <Text style={styles.consultationTime}>
                {consultation.scheduledTime ? 
                  new Date(consultation.scheduledTime).toLocaleString() : 
                  'In Progress'
                }
              </Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: getStatusColor(consultation.status) }
            ]}>
              <Text style={styles.statusText}>
                {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.consultationReason}>{consultation.reason}</Text>

        {consultation.duration && (
          <View style={styles.consultationMeta}>
            <Ionicons name="time-outline" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.metaText}>Duration: {consultation.duration} minutes</Text>
          </View>
        )}

        <View style={styles.consultationActions}>
          {canJoin && (
            <Button
              title={consultation.status === 'active' ? 'Rejoin' : 'Join'}
              onPress={() => handleConsultationAction(consultation, 'join')}
              style={styles.actionButton}
              variant="primary"
              size="small"
            />
          )}
          {canComplete && (
            <Button
              title="Complete"
              onPress={() => handleConsultationAction(consultation, 'complete')}
              style={styles.actionButton}
              variant="success"
              size="small"
            />
          )}
          {canReschedule && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleConsultationAction(consultation, 'reschedule')}
            >
              <Ionicons name="calendar-outline" size={20} color={COLORS.WARNING} />
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleConsultationAction(consultation, 'cancel')}
            >
              <Ionicons name="close-outline" size={20} color={COLORS.ERROR} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Chat', {
              patientId: consultation.patientId,
              patientName: consultation.patientName
            })}
          >
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.INFO} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const CompleteConsultationModal = () => {
    const [notes, setNotes] = useState('');
    const [prescriptionNeeded, setPrescriptionNeeded] = useState(false);

    return (
      <Modal
        visible={showConsultationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConsultationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Consultation</Text>
              <TouchableOpacity onPress={() => setShowConsultationModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {selectedConsultation?.patientName}
            </Text>

            <View style={styles.consultationSummary}>
              <Text style={styles.summaryTitle}>Consultation Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Type:</Text>
                <Text style={styles.summaryValue}>
                  {selectedConsultation?.type.charAt(0).toUpperCase() + selectedConsultation?.type.slice(1)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>{selectedConsultation?.duration || 30} minutes</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Reason:</Text>
                <Text style={styles.summaryValue}>{selectedConsultation?.reason}</Text>
              </View>
            </View>

            <View style={styles.actionOptions}>
              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => {
                  setShowConsultationModal(false);
                  navigation.navigate('Prescriptions', {
                    patientId: selectedConsultation?.patientId,
                    patientName: selectedConsultation?.patientName,
                    action: 'create'
                  });
                }}
              >
                <Ionicons name="medical" size={24} color={COLORS.PRIMARY} />
                <Text style={styles.optionTitle}>Create Prescription</Text>
                <Text style={styles.optionSubtitle}>Prescribe medication</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => {
                  setShowConsultationModal(false);
                  Alert.alert('Feature Coming Soon', 'Medical notes feature will be available soon.');
                }}
              >
                <Ionicons name="document-text" size={24} color={COLORS.SUCCESS} />
                <Text style={styles.optionTitle}>Add Notes</Text>
                <Text style={styles.optionSubtitle}>Medical notes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={() => {
                  setShowConsultationModal(false);
                  Alert.alert('Feature Coming Soon', 'Follow-up appointment scheduling will be available soon.');
                }}
              >
                <Ionicons name="calendar" size={24} color={COLORS.INFO} />
                <Text style={styles.optionTitle}>Schedule Follow-up</Text>
                <Text style={styles.optionSubtitle}>Next appointment</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Complete Without Action"
                onPress={() => completeConsultation('', '')}
                style={styles.modalActionButton}
                variant="outline"
              />
              <Button
                title="Mark Complete"
                onPress={() => completeConsultation('Consultation completed successfully', '')}
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
      active: consultations.filter(c => c.status === 'active').length,
      scheduled: consultations.filter(c => c.status === 'scheduled').length,
      completed: consultations.filter(c => c.status === 'completed').length,
      all: consultations.length
    };
  };

  const counts = getStatusCounts();

  return (
    <SafeAreaView style={styles.container}>
      {/* Stats Header */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.SUCCESS }]}>{counts.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.WARNING }]}>{counts.scheduled}</Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.INFO }]}>{counts.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => Alert.alert('Feature Coming Soon', 'Instant consultation feature will be available soon.')}
        >
          <Ionicons name="flash" size={20} color={COLORS.WHITE} />
          <Text style={styles.quickActionText}>Instant Consult</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.quickActionButton, { backgroundColor: COLORS.SUCCESS }]}
          onPress={() => Alert.alert('Feature Coming Soon', 'Emergency consultation feature will be available soon.')}
        >
          <Ionicons name="warning" size={20} color={COLORS.WHITE} />
          <Text style={styles.quickActionText}>Emergency</Text>
        </TouchableOpacity>
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
            status="scheduled"
            title="Scheduled"
            active={filterStatus === 'scheduled'}
            onPress={() => setFilterStatus('scheduled')}
          />
          <FilterButton
            status="completed"
            title="Completed"
            active={filterStatus === 'completed'}
            onPress={() => setFilterStatus('completed')}
          />
          <FilterButton
            status="all"
            title="All"
            active={filterStatus === 'all'}
            onPress={() => setFilterStatus('all')}
          />
        </ScrollView>
      </View>

      {/* Consultations List */}
      <ScrollView
        style={styles.consultationsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredConsultations.length === 0 ? (
          <Card style={styles.emptyState}>
            <Ionicons name="videocam-outline" size={64} color={COLORS.GRAY_MEDIUM} />
            <Text style={styles.emptyTitle}>No Consultations</Text>
            <Text style={styles.emptySubtitle}>
              {filterStatus === 'all' 
                ? 'No consultations available.'
                : `No ${filterStatus} consultations found.`
              }
            </Text>
          </Card>
        ) : (
          filteredConsultations.map((consultation) => (
            <ConsultationCard key={consultation.id} consultation={consultation} />
          ))
        )}
      </ScrollView>

      <CompleteConsultationModal />
    </SafeAreaView>
  );
};

// Mock consultations data
const mockConsultations = [
  {
    id: '1',
    patientId: 'patient_1',
    patientName: 'John Smith',
    type: 'video',
    status: 'active',
    reason: 'Follow-up consultation for blood pressure monitoring',
    scheduledTime: null, // Currently active
    duration: 30,
    startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString() // Started 15 min ago
  },
  {
    id: '2',
    patientId: 'patient_2',
    patientName: 'Sarah Wilson',
    type: 'video',
    status: 'scheduled',
    reason: 'Annual physical examination discussion',
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    duration: 45
  },
  {
    id: '3',
    patientId: 'patient_3',
    patientName: 'Mike Johnson',
    type: 'chat',
    status: 'active',
    reason: 'Prescription renewal consultation',
    scheduledTime: null,
    duration: 20,
    startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString() // Started 5 min ago
  },
  {
    id: '4',
    patientId: 'patient_4',
    patientName: 'Emily Davis',
    type: 'audio',
    status: 'scheduled',
    reason: 'Quick check-in for medication side effects',
    scheduledTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
    duration: 15
  },
  {
    id: '5',
    patientId: 'patient_5',
    patientName: 'Robert Brown',
    type: 'video',
    status: 'completed',
    reason: 'Surgical consultation follow-up',
    scheduledTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    duration: 60,
    completedTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    notes: 'Patient recovering well from surgery'
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
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
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    marginHorizontal: SPACING.XS,
  },
  quickActionText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    marginLeft: SPACING.XS,
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
  consultationsList: {
    flex: 1,
    padding: SPACING.MD,
  },
  consultationCard: {
    marginBottom: SPACING.MD,
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  consultationDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  consultationType: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS / 2,
    fontWeight: '600',
  },
  consultationTime: {
    fontSize: FONT_SIZES.XS,
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
  consultationReason: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
    lineHeight: 18,
  },
  consultationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  metaText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
  },
  consultationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginRight: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  iconButton: {
    padding: SPACING.SM,
    marginLeft: SPACING.XS,
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
    marginBottom: SPACING.SM,
  },
  modalTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  consultationSummary: {
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.LG,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.XS,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
  },
  actionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.LG,
  },
  optionCard: {
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: COLORS.GRAY_LIGHT,
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
  optionTitle: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.XS,
    marginBottom: SPACING.XS / 2,
  },
  optionSubtitle: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
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

export default DoctorConsultationScreen;