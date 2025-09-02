import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../constants';

// Navigation Components
import AppTabNavigator from './AppTabNavigator';
import DoctorTabNavigator from './DoctorTabNavigator';
import EmergencyTabNavigator from './EmergencyTabNavigator';
import AuthNavigator from './AuthNavigator';

// Loading and Error Components
import LoadingScreen from '../screens/LoadingScreen';
import FirebaseError from '../components/FirebaseError';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, userProfile, loading, error } = useAuth();
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    // Force re-render to retry Firebase initialization
    window.location?.reload?.() || require('react-native').DevSettings?.reload?.();
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Show Firebase error if there's a Firebase-related error
  if (error && (error.includes('Firebase') || error.includes('auth has not been registered'))) {
    return <FirebaseError error={error} onRetry={handleRetry} />;
  }

  // Determine which navigator to show based on user role
  const getMainNavigator = () => {
    if (!userProfile?.role) {
      return AppTabNavigator; // Default to patient interface
    }

    switch (userProfile.role) {
      case USER_ROLES.DOCTOR:
        return DoctorTabNavigator;
      case USER_ROLES.EMERGENCY_OPERATOR:
        return EmergencyTabNavigator;
      case USER_ROLES.PATIENT:
      default:
        return AppTabNavigator;
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={getMainNavigator()} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;