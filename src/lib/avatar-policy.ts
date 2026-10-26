export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export function validateAvatar(size: number, type: string) {
  if(!Number.isFinite(size)||size<=0||size>MAX_AVATAR_BYTES)throw new Error('Choose a photo no larger than 5 MB.');
  if(!AVATAR_TYPES.includes(type))throw new Error('Choose a JPEG, PNG or WebP photo.');
}
