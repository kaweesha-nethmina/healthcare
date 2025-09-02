import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  MEDICAL_SPECIALIZATIONS
} from '../constants';
import Card from '../components/Card';
import Button from '../components/Button';

const DoctorListScreen = ({ navigation, route }) => {
  const { searchQuery: initialSearch, specialization: initialSpecialization, urgent, type } = route.params || {};
  
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [selectedSpecialization, setSelectedSpecialization] = useState(initialSpecialization || '');
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('rating'); // rating, availability, experience

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [searchQuery, selectedSpecialization, doctors, sortBy]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      // In a real app, fetch from Firebase
      // For now, using mock data
      setTimeout(() => {
        setDoctors(mockDoctors);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setDoctors(mockDoctors);
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by specialization
    if (selectedSpecialization) {
      filtered = filtered.filter(doctor => doctor.specialization === selectedSpecialization);
    }

    // Filter for urgent care
    if (urgent) {
      filtered = filtered.filter(doctor => doctor.availableNow);
    }

    // Sort doctors
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.experience - a.experience;
        case 'availability':
          return b.availableNow - a.availableNow;
        default:
          return 0;
      }
    });

    setFilteredDoctors(filtered);
  };

  const handleBookAppointment = (doctor) => {
    navigation.navigate('Booking', { doctor });
  };

  const DoctorCard = ({ doctor }) => (
    <Card style={styles.doctorCard}>
      <View style={styles.doctorHeader}>
        <View style={styles.doctorAvatar}>
          <Ionicons name="person" size={32} color={COLORS.WHITE} />
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialization}>{doctor.specialization}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={COLORS.WARNING} />
            <Text style={styles.rating}>{doctor.rating}</Text>
            <Text style={styles.reviewCount}>({doctor.reviewCount} reviews)</Text>
          </View>
        </View>
        <View style={styles.availabilityContainer}>
          <View style={[
            styles.availabilityBadge,
            { backgroundColor: doctor.availableNow ? COLORS.SUCCESS : COLORS.GRAY_MEDIUM }
          ]}>
            <Text style={styles.availabilityText}>
              {doctor.availableNow ? 'Available' : 'Busy'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.doctorDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={16} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.detailText}>{doctor.location}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.detailText}>{doctor.experience} years experience</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="medical-outline" size={16} color={COLORS.TEXT_SECONDARY} />
          <Text style={styles.detailText}>Consultation fee: ${doctor.consultationFee}</Text>
        </View>
      </View>

      <View style={styles.doctorActions}>
        <Button
          title="View Profile"
          onPress={() => navigation.navigate('DoctorProfile', { doctor })}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="Book Appointment"
          onPress={() => handleBookAppointment(doctor)}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );

  const SpecializationChip = ({ specialization, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.specializationChip,
        isSelected && styles.selectedChip
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.chipText,
        isSelected && styles.selectedChipText
      ]}>
        {specialization}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={COLORS.GRAY_MEDIUM} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Specializations Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <SpecializationChip
            specialization="All"
            isSelected={selectedSpecialization === ''}
            onPress={() => setSelectedSpecialization('')}
          />
          {MEDICAL_SPECIALIZATIONS.slice(0, 10).map((spec) => (
            <SpecializationChip
              key={spec}
              specialization={spec}
              isSelected={selectedSpecialization === spec}
              onPress={() => setSelectedSpecialization(spec)}
            />
          ))}
        </ScrollView>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'rating', label: 'Rating' },
              { key: 'experience', label: 'Experience' },
              { key: 'availability', label: 'Availability' }
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && styles.selectedSortOption
                ]}
                onPress={() => setSortBy(option.key)}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.key && styles.selectedSortOptionText
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsCount}>
          {loading ? 'Loading...' : `${filteredDoctors.length} doctors found`}
          {urgent && ' (Available Now)'}
        </Text>

        <ScrollView style={styles.doctorsList} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              <Text style={styles.loadingText}>Finding doctors for you...</Text>
            </View>
          ) : filteredDoctors.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={64} color={COLORS.GRAY_MEDIUM} />
              <Text style={styles.emptyTitle}>No Doctors Found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search criteria or filters
              </Text>
            </View>
          ) : (
            filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// Mock doctors data
const mockDoctors = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialization: 'General Practitioner',
    rating: 4.8,
    reviewCount: 127,
    experience: 8,
    location: 'Downtown Medical Center',
    consultationFee: 75,
    availableNow: true
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    specialization: 'Cardiologist',
    rating: 4.9,
    reviewCount: 203,
    experience: 15,
    location: 'Heart Care Clinic',
    consultationFee: 150,
    availableNow: false
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    specialization: 'Dermatologist',
    rating: 4.7,
    reviewCount: 89,
    experience: 6,
    location: 'Skin Health Institute',
    consultationFee: 120,
    availableNow: true
  },
  {
    id: '4',
    name: 'Dr. James Wilson',
    specialization: 'Orthopedist',
    rating: 4.6,
    reviewCount: 156,
    experience: 12,
    location: 'Bone & Joint Center',
    consultationFee: 130,
    availableNow: true
  },
  {
    id: '5',
    name: 'Dr. Lisa Anderson',
    specialization: 'Pediatrician',
    rating: 4.9,
    reviewCount: 234,
    experience: 10,
    location: 'Children\'s Health Clinic',
    consultationFee: 90,
    availableNow: false
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  searchSection: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  filterScroll: {
    marginBottom: SPACING.MD,
  },
  specializationChip: {
    backgroundColor: COLORS.GRAY_LIGHT,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.XL,
    marginRight: SPACING.SM,
  },
  selectedChip: {
    backgroundColor: COLORS.PRIMARY,
  },
  chipText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  selectedChipText: {
    color: COLORS.WHITE,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginRight: SPACING.SM,
  },
  sortOption: {
    backgroundColor: COLORS.GRAY_LIGHT,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    marginRight: SPACING.SM,
  },
  selectedSortOption: {
    backgroundColor: COLORS.PRIMARY,
  },
  sortOptionText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  selectedSortOptionText: {
    color: COLORS.WHITE,
  },
  resultsContainer: {
    flex: 1,
    padding: SPACING.MD,
  },
  resultsCount: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  doctorsList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
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
  doctorCard: {
    marginBottom: SPACING.MD,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
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
  doctorInfo: {
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
    marginBottom: SPACING.XS,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.XS / 2,
    marginRight: SPACING.XS,
  },
  reviewCount: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  availabilityContainer: {
    alignItems: 'flex-end',
  },
  availabilityBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS / 2,
    borderRadius: BORDER_RADIUS.SM,
  },
  availabilityText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  doctorDetails: {
    marginBottom: SPACING.MD,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  detailText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
  },
  doctorActions: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  actionButton: {
    flex: 1,
  },
});

export default DoctorListScreen;