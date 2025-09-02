import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
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

const { width, height } = Dimensions.get('window');

const VideoCallScreen = ({ navigation, route }) => {
  const { userProfile } = useAuth();
  const { appointmentId, patientId, patientName, doctorId, doctorName } = route.params || {};
  
  const [callState, setCallState] = useState('connecting'); // connecting, connected, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('good'); // good, fair, poor
  
  const callTimer = useRef(null);

  useEffect(() => {
    // Simulate connection process
    setTimeout(() => {
      setCallState('connected');
      startCallTimer();
    }, 3000);

    return () => {
      if (callTimer.current) {
        clearInterval(callTimer.current);
      }
    };
  }, []);

  const startCallTimer = () => {
    callTimer.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end the video call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: () => {
            setCallState('ended');
            if (callTimer.current) {
              clearInterval(callTimer.current);
            }
            // Navigate back after a brief delay
            setTimeout(() => {
              navigation.goBack();
            }, 2000);
          }
        }
      ]
    );
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In a real app, this would mute/unmute the microphone
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    // In a real app, this would turn camera on/off
  };

  const switchCamera = () => {
    setIsFrontCamera(!isFrontCamera);
    // In a real app, this would switch between front and rear camera
  };

  const handleChat = () => {
    // Navigate to chat while keeping call active (picture-in-picture mode)
    navigation.navigate('Chat', {
      patientId: patientId || doctorId,
      patientName: patientName || doctorName,
      isVideoCallActive: true
    });
  };

  const getConnectionQualityIcon = () => {
    switch (connectionQuality) {
      case 'good':
        return 'wifi';
      case 'fair':
        return 'wifi-outline';
      case 'poor':
        return 'warning';
      default:
        return 'wifi';
    }
  };

  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'good':
        return COLORS.SUCCESS;
      case 'fair':
        return COLORS.WARNING;
      case 'poor':
        return COLORS.ERROR;
      default:
        return COLORS.SUCCESS;
    }
  };

  if (callState === 'ended') {
    return (
      <SafeAreaView style={styles.endedContainer}>
        <View style={styles.endedContent}>
          <Ionicons name="call" size={64} color={COLORS.SUCCESS} />
          <Text style={styles.endedTitle}>Call Ended</Text>
          <Text style={styles.endedSubtitle}>
            Duration: {formatDuration(callDuration)}
          </Text>
          <Text style={styles.endedMessage}>
            Thank you for using LifeLine+ video consultation
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>
            {patientName || doctorName || 'Participant'}
          </Text>
          <View style={styles.statusContainer}>
            <View style={styles.connectionIndicator}>
              <Ionicons 
                name={getConnectionQualityIcon()} 
                size={16} 
                color={getConnectionQualityColor()} 
              />
              <Text style={[styles.connectionText, { color: getConnectionQualityColor() }]}>
                {connectionQuality}
              </Text>
            </View>
            {callState === 'connected' && (
              <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.minimizeButton}
          onPress={() => Alert.alert('Feature Coming Soon', 'Picture-in-picture mode will be available soon.')}
        >
          <Ionicons name="contract-outline" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Video Area */}
      <View style={styles.videoContainer}>
        {callState === 'connecting' ? (
          <View style={styles.connectingContainer}>
            <View style={styles.participantAvatar}>
              <Text style={styles.avatarText}>
                {(patientName || doctorName || 'P').charAt(0)}
              </Text>
            </View>
            <Text style={styles.connectingText}>Connecting...</Text>
            <View style={styles.loadingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
          </View>
        ) : (
          <>
            {/* Main Video Feed */}
            <View style={styles.mainVideo}>
              {isVideoOn ? (
                <View style={styles.videoPlaceholder}>
                  <Ionicons name="person" size={80} color={COLORS.GRAY_MEDIUM} />
                  <Text style={styles.videoPlaceholderText}>
                    {patientName || doctorName || 'Participant'}
                  </Text>
                </View>
              ) : (
                <View style={styles.videoOff}>
                  <Ionicons name="videocam-off" size={40} color={COLORS.WHITE} />
                  <Text style={styles.videoOffText}>Camera is off</Text>
                </View>
              )}
            </View>

            {/* Self Video (Picture-in-Picture) */}
            <View style={styles.selfVideo}>
              {isVideoOn ? (
                <View style={styles.selfVideoPlaceholder}>
                  <Text style={styles.selfVideoText}>You</Text>
                </View>
              ) : (
                <View style={styles.selfVideoOff}>
                  <Ionicons name="videocam-off" size={20} color={COLORS.WHITE} />
                </View>
              )}
            </View>
          </>
        )}
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            <Ionicons 
              name={isMuted ? 'mic-off' : 'mic'} 
              size={24} 
              color={isMuted ? COLORS.ERROR : COLORS.WHITE} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, !isVideoOn && styles.controlButtonActive]}
            onPress={toggleVideo}
          >
            <Ionicons 
              name={isVideoOn ? 'videocam' : 'videocam-off'} 
              size={24} 
              color={!isVideoOn ? COLORS.ERROR : COLORS.WHITE} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={switchCamera}
          >
            <Ionicons name="camera-reverse" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleChat}
          >
            <Ionicons name="chatbubble" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => Alert.alert('Feature Coming Soon', 'Screen sharing will be available soon.')}
          >
            <Ionicons name="desktop" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.endCallButton}
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={28} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      {/* Emergency Button */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => Alert.alert('Emergency', 'Emergency services will be contacted immediately.')}
      >
        <Ionicons name="warning" size={20} color={COLORS.WHITE} />
        <Text style={styles.emergencyText}>Emergency</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BLACK,
  },
  endedContainer: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endedContent: {
    alignItems: 'center',
  },
  endedTitle: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  endedSubtitle: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.PRIMARY,
    marginBottom: SPACING.SM,
  },
  endedMessage: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: SPACING.XS / 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  connectionText: {
    fontSize: FONT_SIZES.SM,
    marginLeft: SPACING.XS / 2,
    fontWeight: '500',
  },
  duration: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.WHITE,
    fontWeight: '500',
  },
  minimizeButton: {
    padding: SPACING.SM,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  avatarText: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  connectingText: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.WHITE,
    marginBottom: SPACING.MD,
  },
  loadingDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
    marginHorizontal: SPACING.XS / 2,
  },
  mainVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    alignItems: 'center',
  },
  videoPlaceholderText: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.WHITE,
    marginTop: SPACING.MD,
  },
  videoOff: {
    alignItems: 'center',
  },
  videoOffText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.WHITE,
    marginTop: SPACING.SM,
  },
  selfVideo: {
    position: 'absolute',
    top: SPACING.LG,
    right: SPACING.MD,
    width: 120,
    height: 160,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: COLORS.GRAY_DARK,
    overflow: 'hidden',
  },
  selfVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
  },
  selfVideoText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.WHITE,
    fontWeight: '500',
  },
  selfVideoOff: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_DARK,
  },
  controlPanel: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.LG,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SPACING.LG,
    width: '100%',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: COLORS.ERROR,
  },
  endCallButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.ERROR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyButton: {
    position: 'absolute',
    top: height * 0.15,
    left: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.EMERGENCY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.XL,
  },
  emergencyText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.WHITE,
    fontWeight: 'bold',
    marginLeft: SPACING.XS,
  },
});

export default VideoCallScreen;