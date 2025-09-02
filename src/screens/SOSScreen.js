import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Animated,
  Vibration,
  Dimensions
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

const { width } = Dimensions.get('window');

const SOSScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [emergencyType, setEmergencyType] = useState('');
  
  const countdownTimer = React.useRef(null);

  useEffect(() => {
    // Start pulse animation
    const pulseAnimationLoop = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulseAnimationLoop());
    };
    
    if (isEmergencyActive) {
      pulseAnimationLoop();
    }

    return () => {
      if (countdownTimer.current) {
        clearInterval(countdownTimer.current);
      }
    };
  }, [isEmergencyActive]);

  const startEmergencyCountdown = (type) => {
    setEmergencyType(type);
    setCountdown(10); // 10 second countdown
    setIsEmergencyActive(true);
    
    // Start vibration pattern
    Vibration.vibrate([0, 1000, 1000, 1000], true);
    
    countdownTimer.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Emergency activated!
          activateEmergency(type);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const activateEmergency = (type) => {
    Vibration.cancel();
    setIsEmergencyActive(false);
    
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
    }

    Alert.alert(
      'Emergency Activated',
      `${type} emergency has been activated. Emergency services and your emergency contacts have been notified.`,
      [
        {
          text: 'View Location',
          onPress: () => navigation.navigate('EmergencyMap', { emergencyType: type })
        },
        {
          text: 'OK',
          onPress: () => {
            // In a real app, this would:
            // 1. Send location to emergency services
            // 2. Contact emergency contacts
            // 3. Start live location tracking
            // 4. Connect to nearest hospital
          }
        }
      ]
    );
  };

  const cancelEmergency = () => {
    Vibration.cancel();
    setIsEmergencyActive(false);
    setCountdown(0);
    
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
    }
  };

  const emergencyTypes = [
    {
      id: 'medical',
      title: 'Medical Emergency',
      subtitle: 'Heart attack, stroke, severe injury',
      icon: 'medical',
      color: COLORS.EMERGENCY,
      description: 'Immediate medical assistance needed'
    },
    {
      id: 'accident',
      title: 'Accident Emergency',
      subtitle: 'Car accident, fall, collision',
      icon: 'car-sport',
      color: COLORS.WARNING,
      description: 'Traffic or physical accident'
    },
    {
      id: 'fire',
      title: 'Fire Emergency',
      subtitle: 'Fire, smoke, burns',
      icon: 'flame',
      color: COLORS.ERROR,
      description: 'Fire or burn related emergency'
    },
    {
      id: 'crime',
      title: 'Security Emergency',
      subtitle: 'Crime, violence, threat',
      icon: 'shield-outline',
      color: COLORS.INFO,
      description: 'Personal safety or security threat'
    },
    {
      id: 'general',
      title: 'General Emergency',
      subtitle: 'Other urgent situations',
      icon: 'alert-circle',
      color: COLORS.PRIMARY,
      description: 'Other emergency situations'
    }
  ];

  const EmergencyTypeCard = ({ emergency }) => (
    <Card style={styles.emergencyCard}>
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => {
          Alert.alert(
            'Confirm Emergency',
            `Are you sure you want to activate ${emergency.title}? This will contact emergency services immediately.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Confirm Emergency',
                style: 'destructive',
                onPress: () => startEmergencyCountdown(emergency.title)
              }
            ]
          );
        }}
      >
        <View style={[styles.emergencyIcon, { backgroundColor: emergency.color }]}>
          <Ionicons name={emergency.icon} size={32} color={COLORS.WHITE} />
        </View>
        <View style={styles.emergencyInfo}>
          <Text style={styles.emergencyTitle}>{emergency.title}</Text>
          <Text style={styles.emergencySubtitle}>{emergency.subtitle}</Text>
          <Text style={styles.emergencyDescription}>{emergency.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={COLORS.GRAY_MEDIUM} />
      </TouchableOpacity>
    </Card>
  );

  if (isEmergencyActive) {
    return (
      <SafeAreaView style={styles.emergencyContainer}>
        <View style={styles.emergencyContent}>
          <Text style={styles.emergencyActiveTitle}>Emergency Activating</Text>
          <Text style={styles.emergencyTypeText}>{emergencyType}</Text>
          
          <Animated.View 
            style={[
              styles.countdownContainer,
              { transform: [{ scale: pulseAnimation }] }
            ]}
          >
            <Text style={styles.countdownText}>{countdown}</Text>
          </Animated.View>
          
          <Text style={styles.countdownLabel}>
            Emergency services will be contacted in {countdown} seconds
          </Text>
          
          <View style={styles.emergencyActions}>
            <Button
              title="Cancel Emergency"
              onPress={cancelEmergency}
              style={styles.cancelButton}
              variant="outline"
            />
          </View>
          
          <Text style={styles.emergencyNote}>
            Your location and emergency contacts will be notified automatically
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Emergency SOS</Text>
        <Text style={styles.subtitle}>
          Quick access to emergency services and contacts
        </Text>
      </View>

      {/* Quick SOS Button */}
      <Card style={styles.quickSOSCard}>
        <TouchableOpacity
          style={styles.quickSOSButton}
          onPress={() => startEmergencyCountdown('Quick Emergency')}
        >
          <Ionicons name="warning" size={48} color={COLORS.WHITE} />
          <Text style={styles.quickSOSText}>QUICK SOS</Text>
          <Text style={styles.quickSOSSubtext}>
            Hold to activate emergency services
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Emergency Types */}
      <View style={styles.emergencyTypesContainer}>
        <Text style={styles.sectionTitle}>Select Emergency Type</Text>
        {emergencyTypes.map((emergency) => (
          <EmergencyTypeCard key={emergency.id} emergency={emergency} />
        ))}
      </View>

      {/* Emergency Contacts */}
      <Card style={styles.emergencyContactsCard}>
        <View style={styles.contactsHeader}>
          <Ionicons name="people" size={24} color={COLORS.PRIMARY} />
          <Text style={styles.contactsTitle}>Emergency Contacts</Text>
        </View>
        
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => Alert.alert('Calling Emergency Services', 'This would dial your local emergency number (911, 112, etc.)')}
        >
          <Ionicons name="call" size={20} color={COLORS.EMERGENCY} />
          <Text style={styles.contactText}>Emergency Services</Text>
          <Text style={styles.contactNumber}>911</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => Alert.alert('Feature Coming Soon', 'Personal emergency contacts management will be available soon.')}
        >
          <Ionicons name="person" size={20} color={COLORS.SUCCESS} />
          <Text style={styles.contactText}>Emergency Contact 1</Text>
          <Text style={styles.contactNumber}>+1 (555) 123-4567</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => Alert.alert('Feature Coming Soon', 'Personal emergency contacts management will be available soon.')}
        >
          <Ionicons name="person" size={20} color={COLORS.SUCCESS} />
          <Text style={styles.contactText}>Emergency Contact 2</Text>
          <Text style={styles.contactNumber}>+1 (555) 987-6543</Text>
        </TouchableOpacity>
      </Card>

      {/* Medical Information */}
      <Card style={styles.medicalInfoCard}>
        <View style={styles.medicalInfoHeader}>
          <Ionicons name="medical" size={24} color={COLORS.INFO} />
          <Text style={styles.medicalInfoTitle}>Medical Information</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="create-outline" size={20} color={COLORS.GRAY_MEDIUM} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.medicalInfoGrid}>
          <View style={styles.medicalInfoItem}>
            <Text style={styles.medicalInfoLabel}>Blood Type</Text>
            <Text style={styles.medicalInfoValue}>{userProfile?.bloodType || 'Not Set'}</Text>
          </View>
          <View style={styles.medicalInfoItem}>
            <Text style={styles.medicalInfoLabel}>Age</Text>
            <Text style={styles.medicalInfoValue}>{userProfile?.age || 'Not Set'}</Text>
          </View>
          <View style={styles.medicalInfoItem}>
            <Text style={styles.medicalInfoLabel}>Allergies</Text>
            <Text style={styles.medicalInfoValue}>None Known</Text>
          </View>
          <View style={styles.medicalInfoItem}>
            <Text style={styles.medicalInfoLabel}>Medications</Text>
            <Text style={styles.medicalInfoValue}>None</Text>
          </View>
        </View>
      </Card>
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
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.EMERGENCY,
    marginBottom: SPACING.XS,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  quickSOSCard: {
    margin: SPACING.MD,
    backgroundColor: COLORS.EMERGENCY,
    borderWidth: 0,
  },
  quickSOSButton: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  quickSOSText: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  quickSOSSubtext: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.WHITE,
    opacity: 0.9,
  },
  emergencyTypesContainer: {
    paddingHorizontal: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  emergencyCard: {
    marginBottom: SPACING.SM,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  emergencyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  emergencySubtitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS / 2,
  },
  emergencyDescription: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.GRAY_MEDIUM,
  },
  emergencyContactsCard: {
    margin: SPACING.MD,
    marginTop: SPACING.SM,
  },
  contactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  contactsTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  contactText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.MD,
    flex: 1,
  },
  contactNumber: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  medicalInfoCard: {
    margin: SPACING.MD,
    marginTop: SPACING.SM,
    marginBottom: SPACING.XL,
  },
  medicalInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.MD,
  },
  medicalInfoTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    marginLeft: SPACING.SM,
  },
  medicalInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  medicalInfoItem: {
    width: '50%',
    paddingVertical: SPACING.SM,
    paddingRight: SPACING.SM,
  },
  medicalInfoLabel: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
    marginBottom: SPACING.XS / 2,
  },
  medicalInfoValue: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  emergencyContainer: {
    flex: 1,
    backgroundColor: COLORS.EMERGENCY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
  },
  emergencyActiveTitle: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  emergencyTypeText: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.WHITE,
    marginBottom: SPACING.XXL,
    textAlign: 'center',
    opacity: 0.9,
  },
  countdownContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  countdownText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: COLORS.EMERGENCY,
  },
  countdownLabel: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.WHITE,
    textAlign: 'center',
    marginBottom: SPACING.XXL,
  },
  emergencyActions: {
    width: '100%',
    marginBottom: SPACING.LG,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderColor: COLORS.WHITE,
  },
  emergencyNote: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.WHITE,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default SOSScreen;