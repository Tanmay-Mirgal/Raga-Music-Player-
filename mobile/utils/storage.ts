import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// In-memory fallback if native file system isn't available
let memoryDownloads: any[] = [];

export const getDownloads = async (): Promise<any[]> => {
  if (Platform.OS === 'web') {
    try {
      const content = window.localStorage.getItem('riffy_downloads');
      return content ? JSON.parse(content) : [];
    } catch (e) {
      console.error('Error reading downloads from localStorage:', e);
      return [];
    }
  }

  const dir = FileSystem.documentDirectory;
  if (!dir) {
    console.warn('FileSystem.documentDirectory is null, falling back to memory storage');
    return memoryDownloads;
  }

  try {
    const file = `${dir}riffy_downloads.json`;
    const fileInfo = await FileSystem.getInfoAsync(file);
    if (!fileInfo.exists) return [];
    const content = await FileSystem.readAsStringAsync(file);
    if (!content || content.trim() === '' || content === 'null' || content === 'undefined') {
      return [];
    }
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading downloads file:', e);
    return [];
  }
};

export const saveDownloads = async (downloads: any[]) => {
  const data = Array.isArray(downloads) ? downloads : [];
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem('riffy_downloads', JSON.stringify(data));
    } catch (e) {
      console.error('Error saving downloads to localStorage:', e);
    }
    return;
  }

  const dir = FileSystem.documentDirectory;
  if (!dir) {
    console.warn('FileSystem.documentDirectory is null, saving to memory storage');
    memoryDownloads = data;
    return;
  }

  try {
    const file = `${dir}riffy_downloads.json`;
    await FileSystem.writeAsStringAsync(file, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing downloads file:', e);
  }
};
