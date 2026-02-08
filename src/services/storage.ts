import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';

export async function uploadAvatar(userId: string, uri: string) {
  try {
    console.log('Uploading avatar from URI:', uri);

    // Create FormData for React Native file upload
    const formData = new FormData();

    // Extract filename from URI or create one
    const filename = `${userId}-${Date.now()}.jpg`;
    const path = `${userId}/${filename}`;

    // @ts-ignore - React Native FormData accepts this format
    formData.append('file', {
      uri: uri,
      type: 'image/jpeg',
      name: filename,
    });

    console.log('Uploading to path:', path);

    // Use Supabase storage upload with the file object directly
    const { error } = await supabase.storage.from('avatars').upload(path, formData, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    const publicUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    console.log('Avatar uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

export async function uploadReviewPhoto(appointmentId: string, uri: string) {
  try {
    console.log('Starting photo upload for appointment:', appointmentId);

    // Create FormData for React Native file upload
    const formData = new FormData();

    // Extract filename from URI or create one
    const filename = `${appointmentId}-${Date.now()}.jpg`;
    const path = `reviews/${appointmentId}/${filename}`;

    // @ts-ignore - React Native FormData accepts this format
    formData.append('file', {
      uri: uri,
      type: 'image/jpeg',
      name: filename,
    });

    console.log('Uploading to path:', path);

    const { error } = await supabase.storage.from('review-photos').upload(path, formData, {
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
  } catch (error) {
    console.error('Error uploading review photo:', error);
    throw error;
  }
}
