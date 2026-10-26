import {supabase, uuid} from './backend';
import {validateAvatar} from './avatar-policy';
import type {ImagePickerAsset} from 'expo-image-picker';
export async function uploadAvatar(userId: string, asset: ImagePickerAsset) {
  if(!supabase)throw new Error('Sign in before uploading a profile photo.');
  const type=asset.mimeType??'image/jpeg';
  if(asset.fileSize!==undefined)validateAvatar(asset.fileSize,type);
  const response=await fetch(asset.uri);
  const bytes=await response.arrayBuffer();
  validateAvatar(bytes.byteLength,type);
  const extension=type==='image/png'?'png':type==='image/webp'?'webp':'jpg';
  const path=`${userId}/${uuid()}.${extension}`;
  const {error}=await supabase.storage.from('profile-avatars').upload(path,bytes,{contentType:type,upsert:false});
  if(error)throw new Error('Profile photo upload failed. Please try again.');
  return {path,url:supabase.storage.from('profile-avatars').getPublicUrl(path).data.publicUrl};
}
