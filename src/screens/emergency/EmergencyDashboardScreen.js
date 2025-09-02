import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
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

const EmergencyDashboardScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    activeEmergencies: [],
    pendingDispatches: [],
    statistics: {},
    alerts: []
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // Set up real-time updates
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // In a real app, fetch from Firebase real-time
      setDashboardData(mockEmergencyData);
    } catch (error) {
      console.error('Error loading emergency dashboard:', error);
      setDashboardData(mockEmergencyData);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleEmergencyAction = (emergency, action) => {
    switch (action) {
      case 'respond':
        navigation.navigate('SOS', { emergencyId: emergency.id });
        break;
      case 'dispatch':
        navigation.navigate('Dispatch', { emergencyId: emergency.id });
        break;
      case 'call':
        Alert.alert('Emergency Call', `Calling ${emergency.patientName}...`);
        break;
      default:
        break;
    }
  };

  const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
    <Card style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color={COLORS.WHITE} />
        </View>
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={trend > 0 ? 'trending-up' : 'trending-down'} 
              size={14} 
              color={trend > 0 ? COLORS.ERROR : COLORS.SUCCESS} 
            />
            <Text style={[styles.trendText, { color: trend > 0 ? COLORS.ERROR : COLORS.SUCCESS }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </Card>
  );

  const EmergencyCard = ({ emergency }) => {
    const urgencyColor = emergency.priority === 'critical' ? COLORS.ERROR :
                        emergency.priority === 'high' ? COLORS.WARNING :
                        COLORS.INFO;

    return (
      <Card style={[styles.emergencyCard, { borderLeftColor: urgencyColor }]}>
        <View style={styles.emergencyHeader}>
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyId}>#{emergency.id}</Text>
            <Text style={styles.patientName}>{emergency.patientName}</Text>
            <Text style={styles.emergencyType}>{emergency.type}</Text>
            <Text style={styles.emergencyTime}>{emergency.timeAgo}</Text>
          </View>
          <View style={styles.emergencyStatus}>
            <View style={[styles.priorityBadge, { backgroundColor: urgencyColor }]}>
              <Text style={styles.priorityText}>{emergency.priority.toUpperCase()}</Text>
            </View>
            <Text style={styles.locationText}>{emergency.location}</Text>
          </View>
        </View>

        <Text style={styles.emergencyDescription}>{emergency.description}</Text>

        <View style={styles.emergencyActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.SUCCESS }]}
            onPress={() => handleEmergencyAction(emergency, 'respond')}
          >
            <Ionicons name="checkmark" size={16} color={COLORS.WHITE} />
            <Text style={styles.actionText}>Respond</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.PRIMARY }]}
            onPress={() => handleEmergencyAction(emergency, 'dispatch')}
          >
            <Ionicons name="car-sport" size={16} color={COLORS.WHITE} />
            <Text style={styles.actionText}>Dispatch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.INFO }]}
            onPress={() => handleEmergencyAction(emergency, 'call')}
          >
            <Ionicons name="call" size={16} color={COLORS.WHITE} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const AlertCard = ({ alert }) => (
    <Card style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <Ionicons name={alert.icon} size={20} color={alert.color} />
        <Text style={styles.alertTitle}>{alert.title}</Text>
        <Text style={styles.alertTime}>{alert.time}</Text>
      </View>
      <Text style={styles.alertMessage}>{alert.message}</Text>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Emergency Control Center</Text>
            <Text style={styles.operatorName}>
              Operator {userProfile?.firstName} {userProfile?.lastName}
            </Text>
            <Text style={styles.shiftInfo}>Shift: {new Date().toLocaleDateString()} - Day Shift</Text>
          </View>
          <TouchableOpacity
            style={styles.alertButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications" size={24} color={COLORS.WHITE} />
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>{dashboardData.alerts.length}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Statistics Grid */}
        <View style={styles.statisticsGrid}>
          <StatCard
            title="Active Emergencies"
            value={dashboardData.statistics.activeEmergencies}
            icon="warning"
            color={COLORS.ERROR}
            trend={5}
            subtitle="Needs immediate attention"
          />
          <StatCard
            title="Dispatched Units"
            value={dashboardData.statistics.dispatchedUnits}
            icon="car-sport"
            color={COLORS.PRIMARY}
            subtitle="Currently en route"
          />
          <StatCard
            title="Response Time"
            value={`${dashboardData.statistics.avgResponseTime}m`}
            icon="time"
            color={COLORS.SUCCESS}
            trend={-12}
            subtitle="Average today"
          />
          <StatCard
            title="Total Calls"
            value={dashboardData.statistics.totalCalls}
            icon="call"
            color={COLORS.INFO}
            subtitle="Since shift start"
          />
        </View>

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: COLORS.ERROR }]}
              onPress={() => Alert.alert('Emergency Alert', 'Broadcasting emergency alert to all units...')}
            >
              <Ionicons name="warning" size={24} color={COLORS.WHITE} />
              <Text style={styles.quickActionText}>Emergency Alert</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: COLORS.PRIMARY }]}
              onPress={() => navigation.navigate('Dispatch')}
            >
              <Ionicons name="car-sport" size={24} color={COLORS.WHITE} />
              <Text style={styles.quickActionText}>Dispatch Unit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: COLORS.SUCCESS }]}
              onPress={() => navigation.navigate('Resources')}
            >
              <Ionicons name="layers" size={24} color={COLORS.WHITE} />
              <Text style={styles.quickActionText}>Resources</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: COLORS.INFO }]}
              onPress={() => Alert.alert('Feature Coming Soon', 'System status monitoring will be available soon.')}
            >
              <Ionicons name="analytics" size={24} color={COLORS.WHITE} />
              <Text style={styles.quickActionText}>System Status</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Active Emergencies */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Emergencies</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SOS')}>
              <Text style={styles.viewAllText}>View All ({dashboardData.activeEmergencies.length})</Text>
            </TouchableOpacity>
          </View>

          {dashboardData.activeEmergencies.length === 0 ? (
            <Card style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.SUCCESS} />
              <Text style={styles.emptyTitle}>No Active Emergencies</Text>
              <Text style={styles.emptySubtitle}>All emergencies have been handled</Text>
            </Card>
          ) : (
            dashboardData.activeEmergencies.slice(0, 3).map((emergency) => (
              <EmergencyCard key={emergency.id} emergency={emergency} />
            ))
          )}
        </View>

        {/* System Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Alerts</Text>
          {dashboardData.alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Mock emergency data
const mockEmergencyData = {
  activeEmergencies: [
    {
      id: 'EMG001',
      patientName: 'John Doe',
      type: 'Medical Emergency',
      priority: 'critical',
      location: '123 Main St, Downtown',
      description: 'Chest pain, difficulty breathing. Patient conscious.',
      timeAgo: '3 minutes ago',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    {
      id: 'EMG002',
      patientName: 'Sarah Wilson',
      type: 'Accident',
      priority: 'high',
      location: 'Highway 101, Mile 15',
      description: 'Vehicle collision, multiple injuries reported.',
      timeAgo: '8 minutes ago',
      coordinates: { lat: 40.7580, lng: -73.9855 }
    },
    {
      id: 'EMG003',
      patientName: 'Mike Johnson',
      type: 'Fire Emergency',
      priority: 'critical',
      location: '456 Oak Avenue',
      description: 'House fire, person trapped inside.',
      timeAgo: '12 minutes ago',
      coordinates: { lat: 40.7589, lng: -73.9851 }
    }
  ],
  statistics: {
    activeEmergencies: 3,
    dispatchedUnits: 8,
    avgResponseTime: 7.2,
    totalCalls: 24
  },
  alerts: [
    {
      id: 'alert1',
      title: 'System Maintenance',
      message: 'Scheduled maintenance in 2 hours',
      time: '10:30 AM',
      icon: 'settings',
      color: COLORS.INFO
    },
    {
      id: 'alert2',
      title: 'High Call Volume',
      message: 'Increased emergency calls in downtown area',
      time: '10:15 AM',
      icon: 'trending-up',
      color: COLORS.WARNING
    }
  ]
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.LG,
    backgroundColor: COLORS.EMERGENCY,
  },
  welcomeContainer: {
    marginBottom: SPACING.SM,
  },
  welcomeText: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: SPACING.XS,
  },
  operatorName: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.WHITE,
    marginBottom: SPACING.XS / 2,
  },
  shiftInfo: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.WHITE,
    opacity: 0.9,
  },
  alertButton: {
    position: 'relative',
    padding: SPACING.SM,
  },
  alertBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: COLORS.WARNING,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBadgeText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  statisticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
  },
  statCard: {
    width: '48%',
    marginBottom: SPACING.MD,
    marginHorizontal: '1%',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: 'bold',
    marginLeft: SPACING.XS / 2,
  },
  statValue: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  statLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS / 2,
  },
  statSubtitle: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
  },
  quickActionsCard: {
    margin: SPACING.MD,
    marginTop: 0,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.SM,
  },
  quickActionText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginTop: SPACING.SM,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: SPACING.MD,
    marginBottom: SPACING.LG,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  viewAllText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  emergencyCard: {
    marginBottom: SPACING.MD,
    borderLeftWidth: 4,
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyId: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    marginBottom: SPACING.XS / 2,
  },
  patientName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  emergencyType: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS / 2,
  },
  emergencyTime: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.GRAY_MEDIUM,
  },
  emergencyStatus: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS / 2,
    borderRadius: BORDER_RADIUS.SM,
    marginBottom: SPACING.XS,
  },
  priorityText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  locationText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.INFO,
  },
  emergencyDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
    marginBottom: SPACING.MD,
  },
  emergencyActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.SM,
  },
  actionText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    fontWeight: 'bold',
    marginLeft: SPACING.XS,
  },
  alertCard: {
    marginBottom: SPACING.SM,
    backgroundColor: COLORS.INFO + '10',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.INFO,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  alertTitle: {
    fontSize: FONT_SIZES.SM,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
    flex: 1,
  },
  alertTime: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
  },
  alertMessage: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
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
});

export default EmergencyDashboardScreen;