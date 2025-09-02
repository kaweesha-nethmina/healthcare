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

const DoctorAppointmentsScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState('all'); // all, upcoming, completed, cancelled
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      // In a real app, fetch from Firebase
      // For now, using mock data
      setAppointments(mockAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments(mockAppointments);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return COLORS.PRIMARY;
      case 'in-progress':
        return COLORS.SUCCESS;
      case 'completed':
        return COLORS.INFO;
      case 'cancelled':
        return COLORS.ERROR;
      case 'rescheduled':
        return COLORS.WARNING;
      default:
        return COLORS.GRAY_MEDIUM;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming':
        return 'time';
      case 'in-progress':
        return 'videocam';
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      case 'rescheduled':
        return 'refresh-circle';
      default:
        return 'help-circle';
    }
  };

  const handleAppointmentAction = (appointment, action) => {
    switch (action) {
      case 'start':
        Alert.alert(
          'Start Consultation',
          `Start consultation with ${appointment.patientName}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Start Video Call',
              onPress: () => navigation.navigate('VideoCall', {
                appointmentId: appointment.id,
                patientId: appointment.patientId,
                patientName: appointment.patientName
              })
            }
          ]
        );
        break;
      case 'reschedule':
        setSelectedAppointment(appointment);
        setShowRescheduleModal(true);
        break;
      case 'cancel':
        Alert.alert(
          'Cancel Appointment',
          `Are you sure you want to cancel the appointment with ${appointment.patientName}?`,
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Yes, Cancel',
              style: 'destructive',
              onPress: () => {
                const updatedAppointments = appointments.map(apt =>
                  apt.id === appointment.id ? { ...apt, status: 'cancelled' } : apt
                );
                setAppointments(updatedAppointments);
                Alert.alert('Success', 'Appointment cancelled successfully');
              }
            }
          ]
        );
        break;
      case 'complete':
        const updatedAppointments = appointments.map(apt =>
          apt.id === appointment.id ? { ...apt, status: 'completed' } : apt
        );
        setAppointments(updatedAppointments);
        Alert.alert('Success', 'Appointment marked as completed');
        break;
      default:
        break;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filterStatus === 'all') return true;
    return appointment.status === filterStatus;
  });

  const getTodaysAppointments = () => {
    const today = new Date().toDateString();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date).toDateString();
      return aptDate === today;
    });
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

  const AppointmentCard = ({ appointment }) => {
    const canStart = appointment.status === 'upcoming' && isAppointmentTime(appointment);
    const canReschedule = ['upcoming'].includes(appointment.status);
    const canCancel = ['upcoming', 'rescheduled'].includes(appointment.status);
    const canComplete = appointment.status === 'in-progress';

    return (
      <Card style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <View style={styles.patientInfo}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientInitial}>
                {appointment.patientName.charAt(0)}
              </Text>
            </View>
            <View style={styles.appointmentDetails}>
              <Text style={styles.patientName}>{appointment.patientName}</Text>
              <Text style={styles.appointmentTime}>
                {formatDateTime(appointment.date)} • {appointment.duration} min
              </Text>
              <Text style={styles.appointmentType}>{appointment.type}</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
              <Ionicons 
                name={getStatusIcon(appointment.status)} 
                size={12} 
                color={COLORS.WHITE} 
              />
              <Text style={styles.statusText}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.appointmentReason}>{appointment.reason}</Text>

        <View style={styles.appointmentActions}>
          {canStart && (
            <Button
              title="Start Call"
              onPress={() => handleAppointmentAction(appointment, 'start')}
              style={styles.actionButton}
              variant="primary"
              size="small"
            />
          )}
          {canComplete && (
            <Button
              title="Complete"
              onPress={() => handleAppointmentAction(appointment, 'complete')}
              style={styles.actionButton}
              variant="success"
              size="small"
            />
          )}
          {canReschedule && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleAppointmentAction(appointment, 'reschedule')}
            >
              <Ionicons name="calendar-outline" size={20} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleAppointmentAction(appointment, 'cancel')}
            >
              <Ionicons name="close-outline" size={20} color={COLORS.ERROR} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Chat', {
              patientId: appointment.patientId,
              patientName: appointment.patientName
            })}
          >
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.SUCCESS} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isAppointmentTime = (appointment) => {
    const now = new Date();
    const appointmentTime = new Date(appointment.date);
    const timeDiff = appointmentTime.getTime() - now.getTime();
    return timeDiff <= 15 * 60 * 1000 && timeDiff >= -15 * 60 * 1000; // Within 15 minutes
  };

  const todaysAppointments = getTodaysAppointments();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todaysAppointments.length}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {appointments.filter(apt => apt.status === 'upcoming').length}
          </Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {appointments.filter(apt => apt.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton
            status="all"
            title="All"
            active={filterStatus === 'all'}
            onPress={() => setFilterStatus('all')}
          />
          <FilterButton
            status="upcoming"
            title="Upcoming"
            active={filterStatus === 'upcoming'}
            onPress={() => setFilterStatus('upcoming')}
          />
          <FilterButton
            status="in-progress"
            title="In Progress"
            active={filterStatus === 'in-progress'}
            onPress={() => setFilterStatus('in-progress')}
          />
          <FilterButton
            status="completed"
            title="Completed"
            active={filterStatus === 'completed'}
            onPress={() => setFilterStatus('completed')}
          />
          <FilterButton
            status="cancelled"
            title="Cancelled"
            active={filterStatus === 'cancelled'}
            onPress={() => setFilterStatus('cancelled')}
          />
        </ScrollView>
      </View>

      {/* Appointments List */}
      <ScrollView
        style={styles.appointmentsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredAppointments.length === 0 ? (
          <Card style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.GRAY_MEDIUM} />
            <Text style={styles.emptyTitle}>No Appointments</Text>
            <Text style={styles.emptySubtitle}>
              {filterStatus === 'all' 
                ? 'You have no appointments scheduled.'
                : `No ${filterStatus} appointments found.`
              }
            </Text>
          </Card>
        ) : (
          filteredAppointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))
        )}
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <Text style={styles.modalSubtitle}>
              {selectedAppointment && `Patient: ${selectedAppointment.patientName}`}
            </Text>
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowRescheduleModal(false)}
                style={styles.modalButton}
                variant="outline"
              />
              <Button
                title="Reschedule"
                onPress={() => {
                  setShowRescheduleModal(false);
                  Alert.alert('Success', 'Appointment reschedule request sent to patient');
                }}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Mock appointments data
const mockAppointments = [
  {
    id: '1',
    patientId: 'patient_1',
    patientName: 'John Smith',
    date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    duration: 30,
    type: 'Video Consultation',
    reason: 'Follow-up consultation for blood pressure',
    status: 'upcoming'
  },
  {
    id: '2',
    patientId: 'patient_2',
    patientName: 'Sarah Wilson',
    date: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
    duration: 45,
    type: 'In-Person',
    reason: 'Annual physical examination',
    status: 'upcoming'
  },
  {
    id: '3',
    patientId: 'patient_3',
    patientName: 'Mike Johnson',
    date: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    duration: 20,
    type: 'Chat Consultation',
    reason: 'Prescription refill consultation',
    status: 'in-progress'
  },
  {
    id: '4',
    patientId: 'patient_4',
    patientName: 'Emily Davis',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    duration: 30,
    type: 'Video Consultation',
    reason: 'Dermatology consultation',
    status: 'completed'
  },
  {
    id: '5',
    patientId: 'patient_5',
    patientName: 'Robert Brown',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    duration: 60,
    type: 'In-Person',
    reason: 'Surgery consultation',
    status: 'upcoming'
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
  appointmentsList: {
    flex: 1,
    padding: SPACING.MD,
  },
  appointmentCard: {
    marginBottom: SPACING.MD,
  },
  appointmentHeader: {
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
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  patientInitial: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  appointmentDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  appointmentTime: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS / 2,
  },
  appointmentType: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  statusContainer: {
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
    marginLeft: SPACING.XS / 2,
    fontWeight: '600',
  },
  appointmentReason: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.MD,
    lineHeight: 18,
  },
  appointmentActions: {
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
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
});

export default DoctorAppointmentsScreen;