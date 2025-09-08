import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';

export async function uploadAvatar(userId: string, uri: string) {
  const file = await uriToBlob(uri);
  const path = `${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

export async function uploadReviewPhoto(appointmentId: string, uri: string) {
  console.log('Starting photo upload for appointment:', appointmentId);
  const file = await uriToBlob(uri);
  const path = `reviews/${appointmentId}/${Date.now()}.jpg`;
  console.log('Uploading to path:', path);
  
  const { error } = await supabase.storage.from('review-photos').upload(path, file, {
    contentType: 'image/jpeg',
    upsert: false, // Don't overwrite existing photos
  });
  
  if (error) {
    console.error('Storage upload error:', error);
    throw error;
  }
  
  const publicUrl = supabase.storage.from('review-photos').getPublicUrl(path).data.publicUrl;
  console.log('Photo uploaded successfully, public URL:', publicUrl);
  return publicUrl;
}

async function uriToBlob(uri: string): Promise<Blob> {
  console.log('Converting URI to blob:', uri);
  
  try {
    // For React Native, we need to use FileSystem to read the file
    if (uri.startsWith('file://')) {
      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('File read as base64, length:', base64.length);
      
      // Convert base64 to blob
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      console.log('Blob created from base64, size:', blob.size);
      return blob;
    } else {
      // For remote URLs, use fetch
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }
      const blob = await response.blob();
      console.log('Blob created from URL, size:', blob.size);
      return blob;
    }
  } catch (error) {
    console.error('Error converting URI to blob:', error);
    throw error;
  }
}
