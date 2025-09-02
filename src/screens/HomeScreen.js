import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONT_SIZES, SPACING } from '../constants';

const HomeScreen = ({ navigation }) => {
  const { userProfile, isPatient, isDoctor, isEmergencyOperator } = useAuth();

  const quickActions = [
    {
      title: 'Emergency SOS',
      subtitle: 'Immediate help',
      icon: 'alert-circle',
      color: COLORS.EMERGENCY,
      onPress: () => navigation.navigate('Emergency', { screen: 'SOS' }),
      show: isPatient
    },
    {
      title: 'Book Consultation',
      subtitle: 'Find a doctor',
      icon: 'medical',
      color: COLORS.PRIMARY,
      onPress: () => navigation.navigate('Consultation', { screen: 'DoctorList' }),
      show: isPatient
    },
    {
      title: 'Health Records',
      subtitle: 'View your history',
      icon: 'folder',
      color: COLORS.SUCCESS,
      onPress: () => navigation.navigate('Health Records', { screen: 'MedicalHistory' }),
      show: true
    },
    {
      title: 'First Aid Guide',
      subtitle: 'Emergency tips',
      icon: 'book',
      color: COLORS.INFO,
      onPress: () => navigation.navigate('FirstAid'),
      show: true
    }
  ];

  const renderQuickAction = (action) => {
    if (!action.show) return null;
    
    return (
      <TouchableOpacity
        key={action.title}
        style={styles.quickActionContainer}
        onPress={action.onPress}
      >
        <Card style={styles.quickActionCard}>
          <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
            <Ionicons name={action.icon} size={32} color={action.color} />
          </View>
          <Text style={styles.quickActionTitle}>{action.title}</Text>
          <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>
                {userProfile?.firstName} {userProfile?.lastName}
              </Text>
              <Text style={styles.userRole}>
                {userProfile?.role?.replace('_', ' ')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={COLORS.TEXT_PRIMARY} />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map(renderQuickAction)}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Card style={styles.activityCard}>
              <View style={styles.activityItem}>
                <Ionicons name="time-outline" size={20} color={COLORS.TEXT_SECONDARY} />
                <Text style={styles.activityText}>
                  No recent activity to show
                </Text>
              </View>
            </Card>
          </View>

          {/* Health Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Tip of the Day</Text>
            <Card variant="primary" style={styles.healthTipCard}>
              <View style={styles.healthTipContent}>
                <Ionicons name="bulb" size={24} color={COLORS.PRIMARY} />
                <View style={styles.healthTipText}>
                  <Text style={styles.healthTipTitle}>Stay Hydrated</Text>
                  <Text style={styles.healthTipDescription}>
                    Drink at least 8 glasses of water daily to maintain good health.
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.XL,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  userName: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.XS,
  },
  userRole: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginTop: SPACING.XS,
    textTransform: 'capitalize',
  },
  notificationButton: {
    position: 'relative',
    padding: SPACING.SM,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.ERROR,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 12,
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: SPACING.XL,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionContainer: {
    width: '48%',
    marginBottom: SPACING.MD,
  },
  quickActionCard: {
    alignItems: 'center',
    paddingVertical: SPACING.LG,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  quickActionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.XS,
  },
  quickActionSubtitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  activityCard: {
    paddingVertical: SPACING.LG,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
  },
  healthTipCard: {
    padding: SPACING.LG,
  },
  healthTipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  healthTipText: {
    flex: 1,
    marginLeft: SPACING.MD,
  },
  healthTipTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  healthTipDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
});

export default HomeScreen;