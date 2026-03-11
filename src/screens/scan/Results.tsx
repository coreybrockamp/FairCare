import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { OCRResult } from '../../services/ocr';

const { width: screenWidth } = Dimensions.get('window');

interface ResultsScreenProps {
  navigation: StackNavigationProp<any>;
  route: any;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ navigation, route }) => {
  const { ocrResult, imageUri, fileName } = route.params as {
    ocrResult: OCRResult;
    imageUri: string;
    fileName: string;
  };
  const [showImage, setShowImage] = useState(false);

  const handleAccept = () => {
    console.log('Results: User accepted OCR results');
    Alert.alert('Success', 'Bill information saved successfully!', [
      {
        text: 'Done',
        onPress: () => {
          // Navigate back to home or next screen
          navigation.navigate('Home');
        },
      },
    ]);
  };

  const handleRetake = () => {
    console.log('Results: User requested retake');
    navigation.popToTop();
  };

  const handleEdit = () => {
    console.log('Results: Editing extracted text');
    Alert.alert('Edit', 'Text editing feature coming soon');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleRetake}>
          <MaterialIcons name="arrow-back" size={28} color="#007bff" />
        </TouchableOpacity>
        <Text style={styles.title}>Bill Details</Text>
        <TouchableOpacity onPress={handleEdit}>
          <MaterialIcons name="edit" size={28} color="#007bff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Preview Toggle */}
        <TouchableOpacity
          style={styles.imageToggle}
          onPress={() => setShowImage(!showImage)}
        >
          <MaterialIcons name={showImage ? 'expand-less' : 'expand-more'} size={20} color="#666" />
          <Text style={styles.imageToggleText}>
            {showImage ? 'Hide' : 'Show'} Captured Image
          </Text>
        </TouchableOpacity>

        {showImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
          </View>
        )}

        {/* Extracted Text Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="description" size={20} color="#007bff" />
            <Text style={styles.sectionTitle}>Extracted Text</Text>
          </View>

          {ocrResult.success && ocrResult.fullText ? (
            <>
              <View style={styles.textBlock}>
                <Text style={styles.extractedText}>{ocrResult.fullText}</Text>
              </View>

              {ocrResult.textBlocks && ocrResult.textBlocks.length > 0 && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsTitle}>Text Blocks ({ocrResult.textBlocks.length})</Text>
                  {ocrResult.textBlocks.slice(0, 10).map((block, index) => (
                    <View key={index} style={styles.textBlockItem}>
                      <View style={styles.blockHeader}>
                        <Text style={styles.blockText} numberOfLines={1}>
                          {block.text}
                        </Text>
                        <Text style={styles.confidence}>
                          {(block.confidence * 100).toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  ))}
                  {ocrResult.textBlocks.length > 10 && (
                    <Text style={styles.moreText}>
                      +{ocrResult.textBlocks.length - 10} more text blocks
                    </Text>
                  )}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noTextContainer}>
              <MaterialIcons name="info" size={40} color="#999" />
              <Text style={styles.noTextMessage}>
                No text could be extracted from this image
              </Text>
            </View>
          )}
        </View>

        {/* Metadata */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="info-outline" size={20} color="#007bff" />
            <Text style={styles.sectionTitle}>Image Info</Text>
          </View>

          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>File Name:</Text>
            <Text style={styles.metadataValue}>{fileName}</Text>
          </View>

          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Language:</Text>
            <Text style={styles.metadataValue}>{ocrResult.language || 'Unknown'}</Text>
          </View>

          {ocrResult.success && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Text Blocks:</Text>
              <Text style={styles.metadataValue}>{ocrResult.textBlocks.length}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.button, styles.retakeButton]} onPress={handleRetake}>
          <MaterialIcons name="refresh" size={20} color="#007bff" />
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={handleAccept}>
          <MaterialIcons name="check-circle" size={20} color="#fff" />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  imageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  imageToggleText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  imageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  image: {
    width: screenWidth - 32,
    height: 300,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  textBlock: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007bff',
  },
  extractedText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  detailsSection: {
    marginTop: 16,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  textBlockItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  blockText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  confidence: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  noTextContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noTextMessage: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metadataLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  metadataValue: {
    fontSize: 13,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retakeButton: {
    borderWidth: 1.5,
    borderColor: '#007bff',
    backgroundColor: '#fff',
  },
  retakeButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#007bff',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ResultsScreen;