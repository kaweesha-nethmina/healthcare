import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS
} from '../constants';

const ChatScreen = ({ navigation, route }) => {
  const { appointmentId, doctorId, doctorName } = route.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    // Load chat messages
    loadMessages();
    
    // Set up real-time messaging (in a real app, use Firebase Firestore real-time listeners)
    // For demo, we'll use mock data
    const timer = setTimeout(() => {
      if (messages.length === 0) {
        setMessages(mockMessages);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      // In a real app, fetch messages from Firebase
      // For now, using mock data
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      senderId: user.uid,
      senderName: 'You',
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // In a real app, send to Firebase
    try {
      // Simulate sending message
      console.log('Sending message:', newMessage);
      
      // Simulate doctor response after 2-3 seconds
      setTimeout(() => {
        const doctorResponse = {
          id: (Date.now() + 1).toString(),
          text: getDoctorResponse(inputText),
          senderId: doctorId || 'doctor_1',
          senderName: doctorName || 'Dr. Sarah Johnson',
          timestamp: new Date().toISOString(),
          type: 'text'
        };
        setMessages(prev => [...prev, doctorResponse]);
      }, 2000 + Math.random() * 1000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const getDoctorResponse = (patientMessage) => {
    const responses = [
      "Thank you for your message. I understand your concern.",
      "Based on what you've described, I recommend the following...",
      "That's a great question. Let me explain...",
      "I see. Can you tell me more about when this started?",
      "For this condition, I usually recommend...",
      "Please continue taking your medication as prescribed.",
      "I'd like to schedule a follow-up appointment to monitor your progress."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const sendQuickMessage = (message) => {
    setInputText(message);
    // Auto-send quick messages
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const MessageBubble = ({ item }) => {
    const isMyMessage = item.senderId === user.uid;
    const messageTime = new Date(item.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          {!isMyMessage && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  const QuickReply = ({ text, onPress }) => (
    <TouchableOpacity style={styles.quickReply} onPress={() => onPress(text)}>
      <Text style={styles.quickReplyText}>{text}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
          <View style={styles.doctorInfo}>
            <View style={styles.doctorAvatar}>
              <Ionicons name="person" size={20} color={COLORS.WHITE} />
            </View>
            <View>
              <Text style={styles.doctorName}>{doctorName || 'Dr. Sarah Johnson'}</Text>
              <Text style={styles.doctorStatus}>Online</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.videoCallButton}>
            <Ionicons name="videocam" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={MessageBubble}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* Quick Replies */}
        <View style={styles.quickRepliesContainer}>
          <Text style={styles.quickRepliesTitle}>Quick replies:</Text>
          <View style={styles.quickRepliesRow}>
            <QuickReply text="How are you feeling?" onPress={sendQuickMessage} />
            <QuickReply text="Thank you doctor" onPress={sendQuickMessage} />
            <QuickReply text="I have a question" onPress={sendQuickMessage} />
          </View>
        </View>

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor={COLORS.GRAY_MEDIUM}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() ? COLORS.WHITE : COLORS.GRAY_MEDIUM} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Mock messages for demonstration
const mockMessages = [
  {
    id: '1',
    text: 'Hello! I\'m Dr. Sarah Johnson. How can I help you today?',
    senderId: 'doctor_1',
    senderName: 'Dr. Sarah Johnson',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    type: 'text'
  },
  {
    id: '2',
    text: 'Hi doctor, I\'ve been having some chest pain since yesterday.',
    senderId: 'patient_1',
    senderName: 'You',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    type: 'text'
  },
  {
    id: '3',
    text: 'I understand your concern. Can you describe the pain? Is it sharp, dull, or burning?',
    senderId: 'doctor_1',
    senderName: 'Dr. Sarah Johnson',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    type: 'text'
  },
  {
    id: '4',
    text: 'It\'s more of a dull ache, and it gets worse when I take deep breaths.',
    senderId: 'patient_1',
    senderName: 'You',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    type: 'text'
  },
  {
    id: '5',
    text: 'Thank you for the details. Based on your symptoms, I\'d like to schedule you for an EKG and chest X-ray. In the meantime, please avoid strenuous activities.',
    senderId: 'doctor_1',
    senderName: 'Dr. Sarah Johnson',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    type: 'text'
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    paddingTop: SPACING.LG,
  },
  backButton: {
    marginRight: SPACING.MD,
  },
  doctorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
  },
  doctorName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  doctorStatus: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.WHITE,
    opacity: 0.8,
  },
  videoCallButton: {
    padding: SPACING.SM,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: SPACING.MD,
    paddingBottom: SPACING.LG,
  },
  messageContainer: {
    marginBottom: SPACING.MD,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.LG,
  },
  myMessageBubble: {
    backgroundColor: COLORS.PRIMARY,
    borderBottomRightRadius: BORDER_RADIUS.SM,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.WHITE,
    borderBottomLeftRadius: BORDER_RADIUS.SM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  senderName: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  messageText: {
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
  },
  myMessageText: {
    color: COLORS.WHITE,
  },
  otherMessageText: {
    color: COLORS.TEXT_PRIMARY,
  },
  messageTime: {
    fontSize: FONT_SIZES.XS,
    marginTop: SPACING.XS / 2,
  },
  myMessageTime: {
    color: COLORS.WHITE,
    opacity: 0.7,
  },
  otherMessageTime: {
    color: COLORS.TEXT_SECONDARY,
  },
  quickRepliesContainer: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  quickRepliesTitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  quickRepliesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickReply: {
    backgroundColor: COLORS.GRAY_LIGHT,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.XL,
    marginRight: SPACING.SM,
    marginBottom: SPACING.XS,
  },
  quickReplyText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
  },
  inputContainer: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: BORDER_RADIUS.XL,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    maxHeight: 100,
    marginRight: SPACING.SM,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  sendButtonInactive: {
    backgroundColor: COLORS.GRAY_LIGHT,
  },
});

export default ChatScreen;