import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
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

const { width, height } = Dimensions.get('window');

const EmergencyMapScreen = ({ navigation, route }) => {
  const { userProfile } = useAuth();
  const { emergencyType } = route.params || {};
  
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Main Street, New York, NY 10001'
  });
  const [nearbyServices, setNearbyServices] = useState([]);
  const [emergencyStatus, setEmergencyStatus] = useState('active');
  const [responseTime, setResponseTime] = useState('8-12 minutes');

  useEffect(() => {
    loadNearbyServices();
    // Simulate location updates
    const locationInterval = setInterval(() => {
      // In a real app, this would update with actual GPS coordinates
    }, 5000);

    return () => clearInterval(locationInterval);
  }, []);

  const loadNearbyServices = () => {
    // Mock nearby emergency services
    const mockServices = [
      {
        id: '1',
        name: 'NYC Fire Department Station 1',
        type: 'Fire Department',
        distance: '0.8 miles',
        eta: '4 minutes',
        phone: '911',
        address: '100 Fire Station Rd',
        icon: 'flame',
        color: COLORS.ERROR
      },
      {
        id: '2',
        name: 'Mount Sinai Hospital',
        type: 'Hospital',
        distance: '1.2 miles',
        eta: '6 minutes',
        phone: '(212) 241-6500',
        address: '1 Gustave L. Levy Pl',
        icon: 'medical',
        color: COLORS.SUCCESS
      },
      {
        id: '3',
        name: 'NYPD 19th Precinct',
        type: 'Police Station',
        distance: '1.5 miles',
        eta: '7 minutes',
        phone: '911',
        address: '153 E 67th St',
        icon: 'shield',
        color: COLORS.INFO
      },
      {
        id: '4',
        name: 'Emergency Medical Services',
        type: 'Ambulance Service',
        distance: '2.1 miles',
        eta: '9 minutes',
        phone: '911',
        address: 'Mobile Unit EN-Route',
        icon: 'car-sport',
        color: COLORS.WARNING
      }
    ];
    
    setNearbyServices(mockServices);
  };

  const handleShareLocation = () => {
    Alert.alert(
      'Share Location',
      'Your current location will be shared with emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: () => Alert.alert('Success', 'Location shared with emergency contacts')
        }
      ]
    );
  };

  const handleCallService = (service) => {
    Alert.alert(
      `Call ${service.name}`,
      `Do you want to call ${service.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Alert.alert('Calling', `Calling ${service.phone}...`)
        }
      ]
    );
  };

  const ServiceCard = ({ service }) => (
    <Card style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={[styles.serviceIcon, { backgroundColor: service.color }]}>
          <Ionicons name={service.icon} size={20} color={COLORS.WHITE} />
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceType}>{service.type}</Text>
          <Text style={styles.serviceAddress}>{service.address}</Text>
        </View>
        <View style={styles.serviceDistance}>
          <Text style={styles.distanceText}>{service.distance}</Text>
          <Text style={styles.etaText}>ETA: {service.eta}</Text>
        </View>
      </View>
      
      <View style={styles.serviceActions}>
        <TouchableOpacity
          style={styles.serviceActionButton}
          onPress={() => handleCallService(service)}
        >
          <Ionicons name="call" size={18} color={COLORS.SUCCESS} />
          <Text style={[styles.actionText, { color: COLORS.SUCCESS }]}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.serviceActionButton}
          onPress={() => Alert.alert('Feature Coming Soon', 'Navigation will be available soon.')}
        >
          <Ionicons name="navigate" size={18} color={COLORS.PRIMARY} />
          <Text style={[styles.actionText, { color: COLORS.PRIMARY }]}>Navigate</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.serviceActionButton}
          onPress={() => Alert.alert('Feature Coming Soon', 'Service info will be available soon.')}
        >
          <Ionicons name="information-circle" size={18} color={COLORS.INFO} />
          <Text style={[styles.actionText, { color: COLORS.INFO }]}>Info</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Location</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareLocation}
        >
          <Ionicons name="share" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emergency Status */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIcon}>
              <Ionicons name="warning" size={24} color={COLORS.WHITE} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Emergency Active</Text>
              <Text style={styles.statusSubtitle}>{emergencyType}</Text>
              <Text style={styles.statusTime}>Response Time: {responseTime}</Text>
            </View>
            <View style={styles.statusIndicator}>
              <View style={styles.pulseDot} />
            </View>
          </View>
        </Card>

        {/* Map Placeholder */}
        <Card style={styles.mapCard}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="location" size={48} color={COLORS.PRIMARY} />
            <Text style={styles.mapTitle}>Your Current Location</Text>
            <Text style={styles.currentAddress}>{currentLocation.address}</Text>
            <Text style={styles.coordinates}>
              Lat: {currentLocation.latitude.toFixed(4)}, Lng: {currentLocation.longitude.toFixed(4)}
            </Text>
          </View>
          
          <View style={styles.mapActions}>
            <TouchableOpacity
              style={styles.mapActionButton}
              onPress={() => Alert.alert('Feature Coming Soon', 'Full map view will be available soon.')}
            >
              <Ionicons name="expand" size={20} color={COLORS.PRIMARY} />
              <Text style={styles.mapActionText}>Full Map</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.mapActionButton}
              onPress={() => Alert.alert('Feature Coming Soon', 'Location refresh will be available soon.')}
            >
              <Ionicons name="refresh" size={20} color={COLORS.SUCCESS} />
              <Text style={styles.mapActionText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: COLORS.EMERGENCY }]}
              onPress={() => Alert.alert('Emergency Call', 'Calling 911...')}
            >
              <Ionicons name="call" size={24} color={COLORS.WHITE} />
              <Text style={styles.quickActionText}>Call 911</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: COLORS.SUCCESS }]}
              onPress={handleShareLocation}
            >
              <Ionicons name="share" size={24} color={COLORS.WHITE} />
              <Text style={styles.quickActionText}>Share Location</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: COLORS.INFO }]}
              onPress={() => Alert.alert('Feature Coming Soon', 'Emergency contacts will be available soon.')}
            >
              <Ionicons name="people" size={24} color={COLORS.WHITE} />
              <Text style={styles.quickActionText}>Contact Family</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nearby Emergency Services */}
        <View style={styles.servicesContainer}>
          <Text style={styles.sectionTitle}>Nearby Emergency Services</Text>
          {nearbyServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </View>

        {/* Emergency Information */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={COLORS.INFO} />
            <Text style={styles.infoTitle}>Emergency Information</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Emergency ID</Text>
              <Text style={styles.infoValue}>#EMG{Date.now().toString().slice(-6)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Time Activated</Text>
              <Text style={styles.infoValue}>{new Date().toLocaleTimeString()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, { color: COLORS.SUCCESS }]}>Active</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Location Accuracy</Text>
              <Text style={styles.infoValue}>±5 meters</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title="Update Emergency Contacts"
          onPress={() => Alert.alert('Feature Coming Soon', 'Emergency contacts management will be available soon.')}
          style={styles.bottomButton}
          variant="outline"
        />
        <Button
          title="Cancel Emergency"
          onPress={() => {
            Alert.alert(
              'Cancel Emergency',
              'Are you sure you want to cancel this emergency?',
              [
                { text: 'No', style: 'cancel' },
                {
                  text: 'Yes, Cancel',
                  style: 'destructive',
                  onPress: () => navigation.goBack()
                }
              ]
            );
          }}
          style={styles.bottomButton}
          variant="danger"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.EMERGENCY,
  },
  backButton: {
    padding: SPACING.XS,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    padding: SPACING.XS,
  },
  content: {
    flex: 1,
    padding: SPACING.MD,
  },
  statusCard: {
    marginBottom: SPACING.MD,
    backgroundColor: COLORS.EMERGENCY + '10',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.EMERGENCY,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.EMERGENCY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.EMERGENCY,
    marginBottom: SPACING.XS / 2,
  },
  statusSubtitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  statusTime: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
  },
  statusIndicator: {
    alignItems: 'center',
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.EMERGENCY,
  },
  mapCard: {
    marginBottom: SPACING.MD,
    minHeight: 200,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XL,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.MD,
  },
  mapTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.SM,
    marginBottom: SPACING.XS,
  },
  currentAddress: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.XS,
  },
  coordinates: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.GRAY_MEDIUM,
    textAlign: 'center',
  },
  mapActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mapActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  mapActionText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    marginLeft: SPACING.XS,
  },
  quickActionsContainer: {
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginHorizontal: SPACING.XS,
  },
  quickActionText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginTop: SPACING.XS,
  },
  servicesContainer: {
    marginBottom: SPACING.MD,
  },
  serviceCard: {
    marginBottom: SPACING.SM,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  serviceType: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS / 2,
    fontWeight: '600',
  },
  serviceAddress: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
  },
  serviceDistance: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  etaText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  serviceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  serviceActionButton: {
    alignItems: 'center',
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.SM,
  },
  actionText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
    marginTop: SPACING.XS / 2,
  },
  infoCard: {
    marginBottom: SPACING.MD,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  infoTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    paddingVertical: SPACING.SM,
    paddingRight: SPACING.SM,
  },
  infoLabel: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
    marginBottom: SPACING.XS / 2,
  },
  infoValue: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  bottomButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
});

export default EmergencyMapScreen;