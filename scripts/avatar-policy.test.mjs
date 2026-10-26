import test from 'node:test';import assert from 'node:assert/strict';
import {validateAvatar,MAX_AVATAR_BYTES} from '../src/lib/avatar-policy.ts';
test('avatars accept supported images up to 5 MB and reject oversized or unsupported uploads',()=>{
 for(const type of ['image/png','image/jpeg','image/webp'])assert.doesNotThrow(()=>validateAvatar(MAX_AVATAR_BYTES,type));
 for(const size of [0,-1,NaN,Infinity,MAX_AVATAR_BYTES+1])assert.throws(()=>validateAvatar(size,'image/png'),/5 MB/);
 for(const type of ['image/svg+xml','video/mp4','application/octet-stream'])assert.throws(()=>validateAvatar(512,type),/JPEG, PNG or WebP/);
});
