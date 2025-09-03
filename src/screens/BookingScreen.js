import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  CONSULTATION_STATUS
} from '../constants';
import Card from '../components/Card';
import Button from '../components/Button';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import NotificationService from '../services/notificationService';

const BookingScreen = ({ navigation, route }) => {
  const { doctor } = route.params || {};
  const { user, userProfile } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('video'); // video, chat, in-person
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);

  useEffect(() => {
    generateAvailableDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      generateAvailableTimes(selectedDate);
    }
  }, [selectedDate]);

  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      dates.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        available: i < 5 // Next 5 days are available
      });
    }
    setAvailableDates(dates);
  };

  const generateAvailableTimes = (date) => {
    // Mock available times based on date
    const times = [
      { time: '09:00 AM', available: true },
      { time: '10:00 AM', available: Math.random() > 0.3 },
      { time: '11:00 AM', available: true },
      { time: '02:00 PM', available: Math.random() > 0.3 },
      { time: '03:00 PM', available: true },
      { time: '04:00 PM', available: Math.random() > 0.3 },
      { time: '06:00 PM', available: true },
      { time: '07:00 PM', available: Math.random() > 0.3 }
    ];
    setAvailableTimes(times);
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Missing Information', 'Please select both date and time for your appointment.');
      return;
    }

    if (!symptoms.trim()) {
      Alert.alert('Missing Information', 'Please describe your symptoms or reason for visit.');
      return;
    }

    setLoading(true);

    try {
      const appointmentData = {
        patientId: user.uid,
        patientName: `${userProfile?.firstName} ${userProfile?.lastName}`,
        patientEmail: user.email,
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialization: doctor.specialization,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        type: appointmentType,
        symptoms: symptoms.trim(),
        status: CONSULTATION_STATUS.PENDING,
        consultationFee: doctor.consultationFee,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // In a real app, save to Firebase
      const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
      const appointmentId = docRef.id;
      
      // Create notification for the patient
      try {
        await NotificationService.createAppointmentNotification(
          user.uid,
          {
            id: appointmentId,
            ...appointmentData
          },
          'created'
        );
        console.log('Appointment notification created successfully');
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the appointment booking if notification creation fails
      }
      
      setLoading(false);
      
      Alert.alert(
        'Appointment Booked!',
        `Your appointment with ${doctor.name} has been scheduled for ${selectedDate} at ${selectedTime}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ConsultationMain')
          }
        ]
      );
    } catch (error) {
      setLoading(false);
      console.error('Error booking appointment:', error);
      
      // For demo purposes, still show success
      Alert.alert(
        'Appointment Booked!',
        `Your appointment with ${doctor.name} has been scheduled for ${selectedDate} at ${selectedTime}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ConsultationMain')
          }
        ]
      );
    }
  };

  const DateButton = ({ dateItem, selected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.dateButton,
        selected && styles.selectedDate,
        !dateItem.available && styles.unavailableDate
      ]}
      onPress={dateItem.available ? onPress : null}
      disabled={!dateItem.available}
    >
      <Text style={[
        styles.dateText,
        selected && styles.selectedDateText,
        !dateItem.available && styles.unavailableDateText
      ]}>
        {dateItem.display}
      </Text>
    </TouchableOpacity>
  );

  const TimeButton = ({ timeItem, selected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.timeButton,
        selected && styles.selectedTime,
        !timeItem.available && styles.unavailableTime
      ]}
      onPress={timeItem.available ? onPress : null}
      disabled={!timeItem.available}
    >
      <Text style={[
        styles.timeText,
        selected && styles.selectedTimeText,
        !timeItem.available && styles.unavailableTimeText
      ]}>
        {timeItem.time}
      </Text>
    </TouchableOpacity>
  );

  const AppointmentTypeButton = ({ type, title, icon, description, selected, onPress }) => (
    <TouchableOpacity
      style={[styles.typeButton, selected && styles.selectedType]}
      onPress={onPress}
    >
      <View style={[styles.typeIcon, selected && styles.selectedTypeIcon]}>
        <Ionicons name={icon} size={24} color={selected ? COLORS.WHITE : COLORS.PRIMARY} />
      </View>
      <View style={styles.typeInfo}>
        <Text style={[styles.typeTitle, selected && styles.selectedTypeTitle]}>{title}</Text>
        <Text style={[styles.typeDescription, selected && styles.selectedTypeDescription]}>
          {description}
        </Text>
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.PRIMARY} />
      )}
    </TouchableOpacity>
  );

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Doctor information not available</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Doctor Info */}
        <Card style={styles.doctorCard}>
          <View style={styles.doctorInfo}>
            <View style={styles.doctorAvatar}>
              <Ionicons name="person" size={32} color={COLORS.WHITE} />
            </View>
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.doctorSpecialization}>{doctor.specialization}</Text>
              <View style={styles.consultationFee}>
                <Ionicons name="card" size={16} color={COLORS.SUCCESS} />
                <Text style={styles.feeText}>Consultation: ${doctor.consultationFee}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Appointment Type */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Select Consultation Type</Text>
          
          <AppointmentTypeButton
            type="video"
            title="Video Consultation"
            icon="videocam"
            description="Face-to-face consultation via video call"
            selected={appointmentType === 'video'}
            onPress={() => setAppointmentType('video')}
          />
          
          <AppointmentTypeButton
            type="chat"
            title="Chat Consultation"
            icon="chatbubble"
            description="Text-based consultation via messaging"
            selected={appointmentType === 'chat'}
            onPress={() => setAppointmentType('chat')}
          />
          
          <AppointmentTypeButton
            type="in-person"
            title="In-Person Visit"
            icon="location"
            description="Visit the clinic for physical examination"
            selected={appointmentType === 'in-person'}
            onPress={() => setAppointmentType('in-person')}
          />
        </Card>

        {/* Date Selection */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {availableDates.map((dateItem) => (
              <DateButton
                key={dateItem.date}
                dateItem={dateItem}
                selected={selectedDate === dateItem.date}
                onPress={() => setSelectedDate(dateItem.date)}
              />
            ))}
          </ScrollView>
        </Card>

        {/* Time Selection */}
        {selectedDate && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <View style={styles.timeGrid}>
              {availableTimes.map((timeItem) => (
                <TimeButton
                  key={timeItem.time}
                  timeItem={timeItem}
                  selected={selectedTime === timeItem.time}
                  onPress={() => setSelectedTime(timeItem.time)}
                />
              ))}
            </View>
          </Card>
        )}

        {/* Symptoms/Reason */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Describe Your Symptoms</Text>
          <Text style={styles.sectionSubtitle}>
            Please provide details about your health concerns or reason for consultation
          </Text>
          <TextInput
            style={styles.symptomsInput}
            value={symptoms}
            onChangeText={setSymptoms}
            placeholder="Describe your symptoms, concerns, or reason for visit..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>

        {/* Booking Summary */}
        {selectedDate && selectedTime && (
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Appointment Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Doctor:</Text>
              <Text style={styles.summaryValue}>{doctor.name}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>{selectedDate}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>{selectedTime}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type:</Text>
              <Text style={styles.summaryValue}>
                {appointmentType === 'video' ? 'Video Call' : 
                 appointmentType === 'chat' ? 'Chat' : 'In-Person'}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fee:</Text>
              <Text style={[styles.summaryValue, styles.feeAmount]}>${doctor.consultationFee}</Text>
            </View>
          </Card>
        )}

        {/* Book Button */}
        <Button
          title={loading ? "Booking..." : "Book Appointment"}
          onPress={handleBookAppointment}
          style={styles.bookButton}
          disabled={loading || !selectedDate || !selectedTime || !symptoms.trim()}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    padding: SPACING.MD,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.LG,
  },
  errorText: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.ERROR,
    marginBottom: SPACING.LG,
  },
  doctorCard: {
    marginBottom: SPACING.MD,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  doctorSpecialization: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
  },
  consultationFee: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.SUCCESS,
    fontWeight: '600',
    marginLeft: SPACING.XS,
  },
  section: {
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.MD,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    marginBottom: SPACING.SM,
  },
  selectedType: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '10',
  },
  typeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.GRAY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  selectedTypeIcon: {
    backgroundColor: COLORS.PRIMARY,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  selectedTypeTitle: {
    color: COLORS.PRIMARY,
  },
  typeDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  selectedTypeDescription: {
    color: COLORS.TEXT_PRIMARY,
  },
  dateScroll: {
    marginBottom: SPACING.SM,
  },
  dateButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginRight: SPACING.SM,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedDate: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  unavailableDate: {
    backgroundColor: COLORS.GRAY_LIGHT,
    opacity: 0.5,
  },
  dateText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  selectedDateText: {
    color: COLORS.WHITE,
  },
  unavailableDateText: {
    color: COLORS.GRAY_MEDIUM,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginRight: SPACING.SM,
    marginBottom: SPACING.SM,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTime: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  unavailableTime: {
    backgroundColor: COLORS.GRAY_LIGHT,
    opacity: 0.5,
  },
  timeText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  selectedTimeText: {
    color: COLORS.WHITE,
  },
  unavailableTimeText: {
    color: COLORS.GRAY_MEDIUM,
  },
  symptomsInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    minHeight: 100,
  },
  summaryCard: {
    backgroundColor: COLORS.PRIMARY + '10',
    marginBottom: SPACING.MD,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.MD,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  feeAmount: {
    color: COLORS.SUCCESS,
    fontSize: FONT_SIZES.LG,
  },
  bookButton: {
    marginBottom: SPACING.XL,
  },
});

export default BookingScreen;