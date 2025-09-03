import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  MEDICAL_SPECIALIZATIONS,
  CONSULTATION_STATUS
} from '../constants';
import Card from '../components/Card';
import Button from '../components/Button';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

const ConsultationScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingAppointments();
  }, []);

  const loadUpcomingAppointments = async () => {
    try {
      setLoading(true);
      
      // Option 1: Simple query without orderBy to avoid index requirement
      // We'll sort in memory instead
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('patientId', '==', user.uid),
        where('status', 'in', [CONSULTATION_STATUS.PENDING, CONSULTATION_STATUS.CONFIRMED])
      );
      
      const snapshot = await getDocs(appointmentsQuery);
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort appointments by date in memory
      const sortedAppointments = appointments.sort((a, b) => {
        const dateA = new Date(a.appointmentDate);
        const dateB = new Date(b.appointmentDate);
        return dateA - dateB;
      });
      
      setUpcomingAppointments(sortedAppointments);
      
    } catch (error) {
      console.error('Error loading appointments:', error);
      
      // If Firestore query fails, try alternative approach or use mock data
      try {
        console.log('Trying alternative query approach...');
        
        // Alternative: Query each status separately and combine
        const pendingQuery = query(
          collection(db, 'appointments'),
          where('patientId', '==', user.uid),
          where('status', '==', CONSULTATION_STATUS.PENDING)
        );
        
        const confirmedQuery = query(
          collection(db, 'appointments'),
          where('patientId', '==', user.uid),
          where('status', '==', CONSULTATION_STATUS.CONFIRMED)
        );
        
        const [pendingSnapshot, confirmedSnapshot] = await Promise.all([
          getDocs(pendingQuery),
          getDocs(confirmedQuery)
        ]);
        
        const pendingAppointments = pendingSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const confirmedAppointments = confirmedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Combine and sort
        const allAppointments = [...pendingAppointments, ...confirmedAppointments];
        const sortedAppointments = allAppointments.sort((a, b) => {
          const dateA = new Date(a.appointmentDate);
          const dateB = new Date(b.appointmentDate);
          return dateA - dateB;
        });
        
        setUpcomingAppointments(sortedAppointments);
        console.log('Alternative query succeeded');
        
      } catch (alternativeError) {
        console.error('Alternative query also failed:', alternativeError);
        // For demo purposes, use mock data if Firebase query fails
        setUpcomingAppointments(mockAppointments);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookNewAppointment = () => {
    navigation.navigate('DoctorList', {
      searchQuery,
      specialization: selectedSpecialization
    });
  };

  const handleAppointmentPress = (appointment) => {
    if (appointment.status === CONSULTATION_STATUS.CONFIRMED) {
      // Navigate to chat or video call based on appointment type
      if (appointment.type === 'video') {
        navigation.navigate('VideoCall', { appointmentId: appointment.id });
      } else {
        navigation.navigate('Chat', { appointmentId: appointment.id });
      }
    } else {
      Alert.alert(
        'Appointment Details',
        `Status: ${appointment.status}\nDate: ${appointment.appointmentDate}\nTime: ${appointment.appointmentTime}`,
        [{ text: 'OK' }]
      );
    }
  };

  const AppointmentCard = ({ appointment }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case CONSULTATION_STATUS.CONFIRMED:
          return COLORS.SUCCESS;
        case CONSULTATION_STATUS.PENDING:
          return COLORS.WARNING;
        default:
          return COLORS.GRAY_MEDIUM;
      }
    };

    return (
      <TouchableOpacity
        style={styles.appointmentCard}
        onPress={() => handleAppointmentPress(appointment)}
      >
        <View style={styles.appointmentHeader}>
          <View style={styles.doctorInfo}>
            <View style={styles.doctorAvatar}>
              <Ionicons name="person" size={24} color={COLORS.WHITE} />
            </View>
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorName}>{appointment.doctorName}</Text>
              <Text style={styles.doctorSpecialization}>{appointment.specialization}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
            <Text style={styles.statusText}>{appointment.status}</Text>
          </View>
        </View>
        
        <View style={styles.appointmentDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.detailText}>{appointment.appointmentDate}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.detailText}>{appointment.appointmentTime}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="videocam-outline" size={16} color={COLORS.TEXT_SECONDARY} />
            <Text style={styles.detailText}>{appointment.type === 'video' ? 'Video Call' : 'Chat'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const SpecializationChip = ({ specialization, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.specializationChip,
        isSelected && styles.selectedChip
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.chipText,
        isSelected && styles.selectedChipText
      ]}>
        {specialization}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Find a Doctor</Text>
          <Text style={styles.subtitle}>Book your consultation today</Text>
        </View>

        {/* Search Bar */}
        <Card style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={COLORS.GRAY_MEDIUM} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search doctors, symptoms, or conditions"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {/* Specializations */}
          <Text style={styles.filterTitle}>Filter by Specialization</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specializationList}>
            <SpecializationChip
              specialization="All"
              isSelected={selectedSpecialization === ''}
              onPress={() => setSelectedSpecialization('')}
            />
            {MEDICAL_SPECIALIZATIONS.slice(0, 8).map((spec) => (
              <SpecializationChip
                key={spec}
                specialization={spec}
                isSelected={selectedSpecialization === spec}
                onPress={() => setSelectedSpecialization(spec)}
              />
            ))}
          </ScrollView>
          
          <Button
            title="Find Doctors"
            onPress={handleBookNewAppointment}
            style={styles.searchButton}
          />
        </Card>

        {/* Quick Actions */}
        <Card style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('DoctorList')}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.PRIMARY }]}>
                <Ionicons name="people-outline" size={24} color={COLORS.WHITE} />
              </View>
              <Text style={styles.actionText}>Browse Doctors</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('DoctorList', { urgent: true })}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.EMERGENCY }]}>
                <Ionicons name="flash-outline" size={24} color={COLORS.WHITE} />
              </View>
              <Text style={styles.actionText}>Urgent Care</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('DoctorList', { type: 'video' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.SUCCESS }]}>
                <Ionicons name="videocam-outline" size={24} color={COLORS.WHITE} />
              </View>
              <Text style={styles.actionText}>Video Consultation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Chat')}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.INFO }]}>
                <Ionicons name="chatbubble-outline" size={24} color={COLORS.WHITE} />
              </View>
              <Text style={styles.actionText}>Chat Support</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Upcoming Appointments */}
        <Card style={styles.appointmentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {upcomingAppointments.length > 0 && (
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              <Text style={styles.loadingText}>Loading appointments...</Text>
            </View>
          ) : upcomingAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.GRAY_MEDIUM} />
              <Text style={styles.emptyTitle}>No Upcoming Appointments</Text>
              <Text style={styles.emptySubtitle}>Book your first consultation with our healthcare professionals</Text>
              <Button
                title="Book Appointment"
                onPress={handleBookNewAppointment}
                style={styles.bookButton}
              />
            </View>
          ) : (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

// Mock data for demonstration
const mockAppointments = [
  {
    id: '1',
    doctorName: 'Dr. Sarah Johnson',
    specialization: 'General Practitioner',
    appointmentDate: '2025-09-03',
    appointmentTime: '10:00 AM',
    status: CONSULTATION_STATUS.CONFIRMED,
    type: 'video'
  },
  {
    id: '2',
    doctorName: 'Dr. Michael Chen',
    specialization: 'Cardiologist',
    appointmentDate: '2025-09-05',
    appointmentTime: '2:30 PM',
    status: CONSULTATION_STATUS.PENDING,
    type: 'chat'
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    padding: SPACING.MD,
  },
  header: {
    marginBottom: SPACING.LG,
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
  searchSection: {
    marginBottom: SPACING.MD,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  filterTitle: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  specializationList: {
    marginBottom: SPACING.MD,
  },
  specializationChip: {
    backgroundColor: COLORS.GRAY_LIGHT,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.XL,
    marginRight: SPACING.SM,
  },
  selectedChip: {
    backgroundColor: COLORS.PRIMARY,
  },
  chipText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  selectedChipText: {
    color: COLORS.WHITE,
  },
  searchButton: {
    marginTop: SPACING.SM,
  },
  quickActions: {
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  actionText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontWeight: '500',
  },
  appointmentsSection: {
    marginBottom: SPACING.XL,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  viewAllText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.XL,
  },
  loadingText: {
    marginLeft: SPACING.SM,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.LG,
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
  },
  bookButton: {
    paddingHorizontal: SPACING.XL,
  },
  appointmentCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  doctorSpecialization: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
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
    textTransform: 'uppercase',
  },
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
  },
});

export default ConsultationScreen;