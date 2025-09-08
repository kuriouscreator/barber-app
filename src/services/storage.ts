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

async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return await res.blob();
}
