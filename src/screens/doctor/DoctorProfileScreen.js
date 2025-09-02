import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image
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

const DoctorProfileScreen = ({ navigation }) => {
  const { userProfile, updateUserProfile, logout } = useAuth();
  const [doctorData, setDoctorData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSection, setEditSection] = useState('');

  useEffect(() => {
    loadDoctorProfile();
  }, []);

  const loadDoctorProfile = async () => {
    try {
      // In a real app, fetch from Firebase
      // For now, using enhanced user profile with doctor-specific data
      const mockDoctorData = {
        ...userProfile,
        specialization: userProfile?.specialization || 'Internal Medicine',
        licenseNumber: 'MD123456789',
        yearsOfExperience: 8,
        education: [
          'MD - Harvard Medical School (2016)',
          'Residency - Johns Hopkins Hospital (2020)',
          'Fellowship - Mayo Clinic (2022)'
        ],
        certifications: [
          'Board Certified Internal Medicine',
          'Advanced Cardiac Life Support (ACLS)',
          'Basic Life Support (BLS)'
        ],
        languages: ['English', 'Spanish', 'French'],
        hospitalAffiliations: [
          'General Hospital Medical Center',
          'City Medical Institute'
        ],
        consultationFee: 150,
        availability: {
          monday: '9:00 AM - 5:00 PM',
          tuesday: '9:00 AM - 5:00 PM',
          wednesday: '9:00 AM - 5:00 PM',
          thursday: '9:00 AM - 5:00 PM',
          friday: '9:00 AM - 3:00 PM',
          saturday: '10:00 AM - 2:00 PM',
          sunday: 'Closed'
        },
        rating: 4.8,
        totalPatients: 156,
        totalConsultations: 342,
        bio: 'Experienced physician specializing in internal medicine with a focus on preventive care and chronic disease management.',
        achievements: [
          'Top Rated Doctor 2023',
          'Excellence in Patient Care Award',
          'Research Publication in NEJM'
        ]
      };
      setDoctorData(mockDoctorData);
    } catch (error) {
      console.error('Error loading doctor profile:', error);
    }
  };

  const handleEditProfile = (section) => {
    setEditSection(section);
    setShowEditModal(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const ProfileHeader = () => (
    <Card style={styles.headerCard}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {doctorData.firstName?.charAt(0)}{doctorData.lastName?.charAt(0)}
            </Text>
          </View>
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={16} color={COLORS.WHITE} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerInfo}>
          <Text style={styles.doctorName}>
            Dr. {doctorData.firstName} {doctorData.lastName}
          </Text>
          <Text style={styles.specialization}>{doctorData.specialization}</Text>
          <Text style={styles.licenseNumber}>License: {doctorData.licenseNumber}</Text>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={COLORS.WARNING} />
            <Text style={styles.rating}>{doctorData.rating}</Text>
            <Text style={styles.ratingCount}>({doctorData.totalPatients} patients)</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditProfile('basic')}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const StatsSection = () => (
    <Card style={styles.statsCard}>
      <Text style={styles.sectionTitle}>Professional Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{doctorData.yearsOfExperience}</Text>
          <Text style={styles.statLabel}>Years Experience</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{doctorData.totalPatients}</Text>
          <Text style={styles.statLabel}>Total Patients</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{doctorData.totalConsultations}</Text>
          <Text style={styles.statLabel}>Consultations</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>${doctorData.consultationFee}</Text>
          <Text style={styles.statLabel}>Consultation Fee</Text>
        </View>
      </View>
    </Card>
  );

  const InfoSection = ({ title, data, icon, onEdit }) => (
    <Card style={styles.infoCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name={icon} size={20} color={COLORS.PRIMARY} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <TouchableOpacity onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color={COLORS.GRAY_MEDIUM} />
        </TouchableOpacity>
      </View>
      
      {Array.isArray(data) ? (
        data.map((item, index) => (
          <Text key={index} style={styles.infoText}>• {item}</Text>
        ))
      ) : typeof data === 'object' ? (
        Object.entries(data).map(([key, value]) => (
          <View key={key} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
            <Text style={styles.infoValue}>{value}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.infoText}>{data}</Text>
      )}
    </Card>
  );

  const ActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate('Settings')}
      >
        <Ionicons name="settings-outline" size={20} color={COLORS.INFO} />
        <Text style={[styles.actionText, { color: COLORS.INFO }]}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => Alert.alert('Feature Coming Soon', 'Professional credentials management will be available soon.')}
      >
        <Ionicons name="document-text-outline" size={20} color={COLORS.SUCCESS} />
        <Text style={[styles.actionText, { color: COLORS.SUCCESS }]}>Credentials</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => Alert.alert('Feature Coming Soon', 'Schedule management will be available soon.')}
      >
        <Ionicons name="calendar-outline" size={20} color={COLORS.WARNING} />
        <Text style={[styles.actionText, { color: COLORS.WARNING }]}>Schedule</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={COLORS.ERROR} />
        <Text style={[styles.actionText, { color: COLORS.ERROR }]}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const EditModal = () => {
    const [editData, setEditData] = useState('');

    useEffect(() => {
      if (editSection === 'bio') {
        setEditData(doctorData.bio || '');
      } else if (editSection === 'fee') {
        setEditData(doctorData.consultationFee?.toString() || '');
      }
    }, [editSection]);

    const handleSave = () => {
      let updatedData = { ...doctorData };
      
      if (editSection === 'bio') {
        updatedData.bio = editData;
      } else if (editSection === 'fee') {
        updatedData.consultationFee = parseInt(editData) || 0;
      }
      
      setDoctorData(updatedData);
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    };

    return (
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {editSection === 'bio' ? 'Biography' : 'Consultation Fee'}
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              {editSection === 'bio' ? (
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={editData}
                  onChangeText={setEditData}
                  placeholder="Enter your professional biography..."
                  multiline
                  numberOfLines={6}
                  placeholderTextColor={COLORS.GRAY_MEDIUM}
                />
              ) : (
                <TextInput
                  style={styles.textInput}
                  value={editData}
                  onChangeText={setEditData}
                  placeholder="Enter consultation fee"
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.GRAY_MEDIUM}
                />
              )}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowEditModal(false)}
                style={styles.modalButton}
                variant="outline"
              />
              <Button
                title="Save"
                onPress={handleSave}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileHeader />
        <StatsSection />
        
        <InfoSection
          title="Biography"
          data={doctorData.bio}
          icon="document-text-outline"
          onEdit={() => handleEditProfile('bio')}
        />

        <InfoSection
          title="Education & Training"
          data={doctorData.education}
          icon="school-outline"
          onEdit={() => Alert.alert('Feature Coming Soon', 'Education management will be available soon.')}
        />

        <InfoSection
          title="Certifications"
          data={doctorData.certifications}
          icon="ribbon-outline"
          onEdit={() => Alert.alert('Feature Coming Soon', 'Certification management will be available soon.')}
        />

        <InfoSection
          title="Languages"
          data={doctorData.languages}
          icon="language-outline"
          onEdit={() => Alert.alert('Feature Coming Soon', 'Language management will be available soon.')}
        />

        <InfoSection
          title="Hospital Affiliations"
          data={doctorData.hospitalAffiliations}
          icon="business-outline"
          onEdit={() => Alert.alert('Feature Coming Soon', 'Affiliation management will be available soon.')}
        />

        <InfoSection
          title="Availability"
          data={doctorData.availability}
          icon="time-outline"
          onEdit={() => Alert.alert('Feature Coming Soon', 'Schedule management will be available soon.')}
        />

        <InfoSection
          title="Achievements"
          data={doctorData.achievements}
          icon="trophy-outline"
          onEdit={() => Alert.alert('Feature Coming Soon', 'Achievement management will be available soon.')}
        />

        <ActionButtons />
      </ScrollView>

      <EditModal />
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
  headerCard: {
    marginBottom: SPACING.MD,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.MD,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.SUCCESS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  specialization: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginBottom: SPACING.XS / 2,
  },
  licenseNumber: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.XS / 2,
    marginRight: SPACING.XS,
  },
  ratingCount: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  editButton: {
    padding: SPACING.SM,
  },
  statsCard: {
    marginBottom: SPACING.MD,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
  },
  statNumber: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  statLabel: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: SPACING.MD,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  infoText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
    marginBottom: SPACING.XS,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.XS,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  infoLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.MD,
    marginBottom: SPACING.XL,
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.SM,
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.SM,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    marginTop: SPACING.XS,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  modalTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  inputContainer: {
    marginBottom: SPACING.LG,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
});

export default DoctorProfileScreen;