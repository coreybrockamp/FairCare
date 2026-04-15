import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
// icons come from expo's vector icons package which now includes proper types
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { readImageAsBase64 } from '../services/storage';

const { width: screenWidth } = Dimensions.get('window');

export interface UploadedFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  mimeType?: string;
}

interface UploadBillProps {
  onFileSelected: (file: UploadedFile) => void;
  onUploadProgress?: (progress: number) => void;
  isUploading?: boolean;
}

const UploadBill: React.FC<UploadBillProps> = ({
  onFileSelected,
  onUploadProgress,
  isUploading = false,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const getFileTypeIcon = (mimeType?: string, fileName?: string) => {
    if (mimeType?.includes('pdf') || fileName?.endsWith('.pdf')) {
      return 'picture-as-pdf';
    }
    if (
      mimeType?.includes('image') ||
      fileName?.match(/\.(jpg|jpeg|png|heic|heif)$/i)
    ) {
      return 'image';
    }
    return 'description';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handlePickImage = async () => {
    if (isSelecting || isUploading) return;

    setIsSelecting(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera roll access is required');
        setIsSelecting(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        // `fileName` is the correct property on the asset type
        const file: UploadedFile = {
          uri: asset.uri,
          name: asset.fileName || `image-${Date.now()}.jpg`,
          type: 'image',
          size: asset.fileSize || 0,
          mimeType: asset.type || 'image/jpeg',
        };

        setSelectedFiles([...selectedFiles, file]);
        onFileSelected(file);
      }
    } catch (error: any) {
      console.error('UploadBill: Image picker error:', error);
      Alert.alert('Error', error.message || 'Failed to pick image');
    } finally {
      setIsSelecting(false);
    }
  };

  const handlePickDocument = async () => {
    if (isSelecting || isUploading) return;

    setIsSelecting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        // `assets` is an array of DocumentPickerAsset objects
        const asset = result.assets[0];
        const file: UploadedFile = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType?.includes('pdf') ? 'pdf' : 'image',
          size: asset.size || 0,
          mimeType: asset.mimeType,
        };

        setSelectedFiles([...selectedFiles, file]);
        onFileSelected(file);
      }
    } catch (error: any) {
      console.error('UploadBill: Document picker error:', error);
      Alert.alert('Error', error.message || 'Failed to pick document');
    } finally {
      setIsSelecting(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const renderFileItem = ({ item, index }: { item: UploadedFile; index: number }) => (
    <View style={styles.fileItem}>
      <MaterialIcons name={getFileTypeIcon(item.mimeType, item.name)} size={32} color="#007bff" />
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.fileSize}>{formatFileSize(item.size)}</Text>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveFile(index)}
        disabled={isUploading}
        style={styles.removeButton}
      >
        <MaterialIcons name="close" size={20} color="#d32f2f" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Upload Options */}
      <View style={styles.uploadOptions}>
        <TouchableOpacity
          style={[styles.uploadButton, isSelecting && styles.buttonDisabled]}
          onPress={handlePickImage}
          disabled={isSelecting || isUploading}
        >
          {isSelecting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="image" size={20} color="#fff" />
              <Text style={styles.uploadButtonText}>Pick Photo</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadButton, isSelecting && styles.buttonDisabled]}
          onPress={handlePickDocument}
          disabled={isSelecting || isUploading}
        >
          {isSelecting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="description" size={20} color="#fff" />
              <Text style={styles.uploadButtonText}>Pick File</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <View style={styles.fileListContainer}>
          <View style={styles.fileListHeader}>
            <Text style={styles.fileListTitle}>Selected Files ({selectedFiles.length})</Text>
          </View>
          <FlatList
            data={selectedFiles}
            renderItem={renderFileItem}
            keyExtractor={(_, index) => index.toString()}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="small" color="#007bff" />
          <Text style={styles.progressText}>Uploading...</Text>
        </View>
      )}

      {/* Info Message */}
      {selectedFiles.length === 0 && !isSelecting && (
        <View style={styles.infoContainer}>
          <MaterialIcons name="info" size={32} color="#999" />
          <Text style={styles.infoText}>Pick an image or PDF to get started</Text>
          <Text style={styles.infoSubtext}>Supported: JPG, PNG, HEIC, PDF</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  fileListContainer: {
    marginBottom: 20,
  },
  fileListHeader: {
    marginBottom: 12,
  },
  fileListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007bff',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default UploadBill;
