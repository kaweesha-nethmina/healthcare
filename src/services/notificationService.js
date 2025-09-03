import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { NOTIFICATION_TYPES } from '../constants';

/**
 * Notification Service for Firebase Firestore
 * Manages user-specific notifications with real-time updates
 */
export class NotificationService {
  
  /**
   * Create a new notification for a specific user
   * @param {string} userId - Target user ID
   * @param {Object} notificationData - Notification details
   */
  static async createNotification(userId, notificationData) {
    try {
      const notification = {
        userId: userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || NOTIFICATION_TYPES.REMINDER,
        read: false,
        timestamp: serverTimestamp(),
        data: notificationData.data || {},
        priority: notificationData.priority || 'normal', // low, normal, high, urgent
        expiresAt: notificationData.expiresAt || null,
        actionUrl: notificationData.actionUrl || null,
        createdBy: notificationData.createdBy || 'system',
        category: notificationData.category || 'general'
      };

      const docRef = await addDoc(collection(db, 'notifications'), notification);
      console.log('Notification created with ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...notification,
        timestamp: new Date() // Convert serverTimestamp for immediate use
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a specific user with filtering options
   * @param {string} userId - User ID
   * @param {Object} options - Filter options
   */
  static async getUserNotifications(userId, options = {}) {
    try {
      const {
        unreadOnly = false,
        type = null,
        limitCount = 50,
        category = null
      } = options;

      let q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );

      // Add filters
      if (unreadOnly) {
        q = query(q, where('read', '==', false));
      }

      if (type) {
        q = query(q, where('type', '==', type));
      }

      if (category) {
        q = query(q, where('category', '==', category));
      }

      // Add ordering and limit - Remove orderBy to avoid index requirement
      // We'll sort in memory instead
      // q = query(q, orderBy('timestamp', 'desc'), limit(limitCount));

      const snapshot = await getDocs(q);
      const notifications = [];

      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        });
      });

      // Sort in memory by timestamp (newest first) and apply limit
      const sortedNotifications = notifications
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limitCount);

      return sortedNotifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   */
  static async getUnreadCount(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   */
  static async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
      console.log('Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   */
  static async markAllAsRead(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: serverTimestamp()
        });
      });

      await batch.commit();
      console.log(`Marked ${snapshot.size} notifications as read for user:`, userId);
      return snapshot.size;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   */
  static async deleteNotification(notificationId) {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      console.log('Notification deleted:', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   * @param {string} userId - User ID
   */
  static async deleteAllUserNotifications(userId) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${snapshot.size} notifications for user:`, userId);
      return snapshot.size;
    } catch (error) {
      console.error('Error deleting all user notifications:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function for updates
   * @param {Object} options - Filter options
   */
  static subscribeToUserNotifications(userId, callback, options = {}) {
    try {
      const {
        unreadOnly = false,
        type = null,
        limitCount = 50
      } = options;

      let q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );

      if (unreadOnly) {
        q = query(q, where('read', '==', false));
      }

      if (type) {
        q = query(q, where('type', '==', type));
      }

      // Remove orderBy to avoid index requirement - sort in memory instead
      // q = query(q, orderBy('timestamp', 'desc'), limit(limitCount));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifications = [];
        snapshot.forEach((doc) => {
          notifications.push({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date()
          });
        });

        // Sort in memory by timestamp (newest first) and apply limit
        const sortedNotifications = notifications
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limitCount);

        callback(sortedNotifications);
      }, (error) => {
        console.error('Error in notification subscription:', error);
        callback([]); // Return empty array on error
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return () => {}; // Return dummy unsubscribe function
    }
  }

  /**
   * Create appointment-related notifications
   */
  static async createAppointmentNotification(userId, appointmentData, type = 'created') {
    const notificationData = {
      title: this.getAppointmentNotificationTitle(type),
      message: this.getAppointmentNotificationMessage(type, appointmentData),
      type: NOTIFICATION_TYPES.APPOINTMENT,
      category: 'appointment',
      priority: type === 'cancelled' ? 'high' : 'normal',
      data: {
        appointmentId: appointmentData.id,
        doctorName: appointmentData.doctorName,
        appointmentDate: appointmentData.appointmentDate,
        appointmentTime: appointmentData.appointmentTime,
        type: type
      },
      actionUrl: `/consultation/${appointmentData.id}`
    };

    return this.createNotification(userId, notificationData);
  }

  /**
   * Create emergency notifications
   */
  static async createEmergencyNotification(userId, emergencyData) {
    const notificationData = {
      title: 'Emergency Alert',
      message: emergencyData.message || 'Emergency assistance has been requested',
      type: NOTIFICATION_TYPES.EMERGENCY,
      category: 'emergency',
      priority: 'urgent',
      data: emergencyData,
      actionUrl: `/emergency/${emergencyData.id}`
    };

    return this.createNotification(userId, notificationData);
  }

  /**
   * Helper methods for notification content
   */
  static getAppointmentNotificationTitle(type) {
    switch (type) {
      case 'created': return 'Appointment Booked';
      case 'confirmed': return 'Appointment Confirmed';
      case 'cancelled': return 'Appointment Cancelled';
      case 'reminder': return 'Appointment Reminder';
      case 'completed': return 'Appointment Completed';
      default: return 'Appointment Update';
    }
  }

  static getAppointmentNotificationMessage(type, appointmentData) {
    const { doctorName, appointmentDate, appointmentTime } = appointmentData;
    
    switch (type) {
      case 'created':
        return `Your appointment with ${doctorName} has been scheduled for ${appointmentDate} at ${appointmentTime}`;
      case 'confirmed':
        return `Your appointment with ${doctorName} on ${appointmentDate} at ${appointmentTime} has been confirmed`;
      case 'cancelled':
        return `Your appointment with ${doctorName} on ${appointmentDate} at ${appointmentTime} has been cancelled`;
      case 'reminder':
        return `Reminder: You have an appointment with ${doctorName} today at ${appointmentTime}`;
      case 'completed':
        return `Your appointment with ${doctorName} has been completed. Please rate your experience.`;
      default:
        return `Your appointment with ${doctorName} has been updated`;
    }
  }

  /**
   * Clean up expired notifications
   * @param {string} userId - User ID (optional, if not provided cleans all expired)
   */
  static async cleanupExpiredNotifications(userId = null) {
    try {
      let q = query(
        collection(db, 'notifications'),
        where('expiresAt', '<=', new Date())
      );

      if (userId) {
        q = query(q, where('userId', '==', userId));
      }

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${snapshot.size} expired notifications`);
      return snapshot.size;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }
}

export default NotificationService;