import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS
} from '../constants';
import Card from '../components/Card';
import Button from '../components/Button';

const UploadDocumentScreen = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      // In a real app, fetch from Firebase Storage
      // For now, using mock data
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments(mockDocuments);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadDocument(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
      console.error('Document picker error:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadDocument(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadDocument(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      console.error('Camera error:', error);
    }
  };

  const uploadDocument = async (file) => {
    setUploading(true);
    try {
      // In a real app, upload to Firebase Storage
      // For now, simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newDocument = {
        id: Date.now().toString(),
        name: file.name || `Image_${Date.now()}`,
        type: file.mimeType || 'image/jpeg',
        size: file.size || 0,
        uri: file.uri,
        uploadDate: new Date().toISOString(),
        category: 'general'
      };

      setDocuments(prev => [newDocument, ...prev]);
      Alert.alert('Success', 'Document uploaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (docId) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDocuments(prev => prev.filter(doc => doc.id !== docId));
            Alert.alert('Success', 'Document deleted successfully');
          }
        }
      ]
    );
  };

  const getDocumentIcon = (type) => {
    if (type.includes('pdf')) return 'document-text';
    if (type.includes('image')) return 'image';
    return 'document';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const UploadOptionCard = ({ title, subtitle, icon, color, onPress }) => (
    <TouchableOpacity style={styles.uploadOption} onPress={onPress}>
      <View style={[styles.uploadIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={32} color={COLORS.WHITE} />
      </View>
      <View style={styles.uploadText}>
        <Text style={styles.uploadTitle}>{title}</Text>
        <Text style={styles.uploadSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.GRAY_MEDIUM} />
    </TouchableOpacity>
  );

  const DocumentCard = ({ document }) => (
    <Card style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentIconContainer}>
          <Ionicons 
            name={getDocumentIcon(document.type)} 
            size={24} 
            color={COLORS.PRIMARY} 
          />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentName} numberOfLines={1}>
            {document.name}
          </Text>
          <Text style={styles.documentMeta}>
            {formatFileSize(document.size)} • {new Date(document.uploadDate).toLocaleDateString()}
          </Text>
          <Text style={styles.documentCategory}>{document.category}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteDocument(document.id)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.ERROR} />
        </TouchableOpacity>
      </View>
      {document.type.includes('image') && document.uri && (
        <Image source={{ uri: document.uri }} style={styles.documentPreview} />
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Upload Documents</Text>
          <Text style={styles.subtitle}>
            Keep your medical documents safe and accessible
          </Text>
        </View>

        {/* Upload Options */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Document</Text>
          
          <UploadOptionCard
            title="Take Photo"
            subtitle="Capture document with camera"
            icon="camera"
            color={COLORS.PRIMARY}
            onPress={takePhoto}
          />
          
          <UploadOptionCard
            title="Choose from Gallery"
            subtitle="Select image from photos"
            icon="image"
            color={COLORS.SUCCESS}
            onPress={pickImage}
          />
          
          <UploadOptionCard
            title="Browse Files"
            subtitle="Select PDF or other documents"
            icon="document"
            color={COLORS.INFO}
            onPress={pickDocument}
          />
        </Card>

        {/* Upload Progress */}
        {uploading && (
          <Card style={styles.uploadProgress}>
            <View style={styles.progressContent}>
              <Ionicons name="cloud-upload" size={24} color={COLORS.PRIMARY} />
              <Text style={styles.progressText}>Uploading document...</Text>
            </View>
          </Card>
        )}

        {/* Documents List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            My Documents ({documents.length})
          </Text>
          
          {documents.length === 0 ? (
            <Card style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={64} color={COLORS.GRAY_MEDIUM} />
              <Text style={styles.emptyTitle}>No Documents</Text>
              <Text style={styles.emptySubtitle}>
                Upload your medical documents to keep them organized and secure
              </Text>
            </Card>
          ) : (
            documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))
          )}
        </View>

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={20} color={COLORS.INFO} />
            <Text style={styles.tipsTitle}>Tips for Better Documents</Text>
          </View>
          <Text style={styles.tipsText}>
            • Ensure documents are well-lit and clear{'\n'}
            • Use PDF format for multi-page documents{'\n'}
            • Keep file sizes under 10MB for faster uploads{'\n'}
            • Organize documents by category for easy access
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

// Mock documents data
const mockDocuments = [
  {
    id: '1',
    name: 'Blood Test Results - March 2024',
    type: 'application/pdf',
    size: 1024576,
    uploadDate: '2024-03-15T10:00:00Z',
    category: 'Lab Results'
  },
  {
    id: '2',
    name: 'Prescription - Dr. Johnson',
    type: 'image/jpeg',
    size: 512000,
    uploadDate: '2024-03-10T14:30:00Z',
    category: 'Prescriptions'
  },
  {
    id: '3',
    name: 'Insurance Card',
    type: 'image/png',
    size: 256000,
    uploadDate: '2024-02-28T09:15:00Z',
    category: 'Insurance'
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    padding: SPACING.MD,
  },
  header: {
    marginBottom: SPACING.LG,
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  section: {
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  uploadIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  uploadText: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  uploadSubtitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  uploadProgress: {
    marginBottom: SPACING.MD,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
  },
  progressText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.PRIMARY,
    marginLeft: SPACING.SM,
    fontWeight: '600',
  },
  documentCard: {
    marginBottom: SPACING.SM,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS / 2,
  },
  documentMeta: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS / 2,
  },
  documentCategory: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  deleteButton: {
    padding: SPACING.SM,
  },
  documentPreview: {
    width: '100%',
    height: 150,
    borderRadius: BORDER_RADIUS.MD,
    marginTop: SPACING.SM,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.MD,
    marginBottom: SPACING.XS,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    paddingHorizontal: SPACING.MD,
  },
  tipsCard: {
    backgroundColor: COLORS.INFO + '10',
    marginBottom: SPACING.XL,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  tipsTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.INFO,
    marginLeft: SPACING.SM,
  },
  tipsText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
});

export default UploadDocumentScreen;