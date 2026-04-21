import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getTimeFormat, setTimeFormat, TimeFormat, exportAllData, importAllData, clearAllData } from '../store/storage';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('24');

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
    }, [])
  );

  async function loadSettings() {
    const format = await getTimeFormat();
    setTimeFormatState(format);
  }

  async function handleTimeFormatChange(format: TimeFormat) {
    setTimeFormatState(format);
    await setTimeFormat(format);
  }

  async function handleExportToClipboard() {
    try {
      const data = await exportAllData();
      const jsonString = JSON.stringify(data, null, 2);
      Clipboard.setString(jsonString);
      Alert.alert('Success', 'Data copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data to clipboard.');
      console.error(error);
    }
  }

  async function handleImportFromClipboard() {
    try {
      const jsonString = await Clipboard.getString();
      if (!jsonString) {
        Alert.alert('Error', 'No data found in clipboard.');
        return;
      }
      const data = JSON.parse(jsonString);

      Alert.alert(
        'Confirm Import',
        'This will replace all your current data. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              try {
                await importAllData(data);
                Alert.alert('Success', 'Data imported successfully!');
                loadSettings();
              } catch (error) {
                Alert.alert('Error', 'Failed to import data.');
                console.error(error);
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Invalid data format in clipboard.');
      console.error(error);
    }
  }

  async function handleExportToFile() {
    try {
      const data = await exportAllData();
      const jsonString = JSON.stringify(data, null, 2);

      const fileName = `level-up-habits-backup-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${documentDirectory}${fileName}`;

      await writeAsStringAsync(fileUri, jsonString, {
        encoding: EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', `Data exported to: ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data to file.');
      console.error(error);
    }
  }

  async function handleImportFromFile() {
    Alert.alert(
      'Import from File',
      'To import data from a file:\n\n1. Copy the entire contents of your backup JSON file\n2. Use "Paste from Clipboard" button to import',
      [{ text: 'OK' }]
    );
  }

  async function handleClearAllData() {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all habits, logs, tasks, and settings. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Success', 'All data cleared successfully!');
              loadSettings();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data.');
              console.error(error);
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(20, insets.bottom) },
      ]}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time Display</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Time Format</Text>
            <Text style={styles.settingDescription}>
              Choose how times are displayed throughout the app
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                timeFormat === '12' && styles.toggleOptionActive,
              ]}
              onPress={() => handleTimeFormatChange('12')}
            >
              <Text
                style={[
                  styles.toggleText,
                  timeFormat === '12' && styles.toggleTextActive,
                ]}
              >
                12h
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                timeFormat === '24' && styles.toggleOptionActive,
              ]}
              onPress={() => handleTimeFormatChange('24')}
            >
              <Text
                style={[
                  styles.toggleText,
                  timeFormat === '24' && styles.toggleTextActive,
                ]}
              >
                24h
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleLabel}>Example:</Text>
          <Text style={styles.exampleTime}>
            {timeFormat === '12' ? '02:30 PM' : '14:30'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <Text style={styles.sectionDescription}>
          Export or import your data for backup or moving between devices
        </Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleExportToClipboard}
          >
            <Text style={styles.primaryButtonText}>Copy to Clipboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleImportFromClipboard}
          >
            <Text style={styles.primaryButtonText}>Paste from Clipboard</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleExportToFile}
          >
            <Text style={styles.secondaryButtonText}>Export to File</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleImportFromFile}
          >
            <Text style={styles.secondaryButtonText}>Import from File</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleClearAllData}
        >
          <Text style={styles.dangerButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f0f0f0',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f0f0f0',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 2,
  },
  toggleOption: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  toggleOptionActive: {
    backgroundColor: '#6366f1',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  toggleTextActive: {
    color: '#fff',
  },
  exampleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  exampleLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginRight: 8,
  },
  exampleTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a5b4fc',
  },
  sectionDescription: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
    marginBottom: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f0f0f0',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
