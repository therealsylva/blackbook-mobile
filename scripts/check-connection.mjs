import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const defaults=JSON.parse(await readFile(new URL('../src/lib/public-connection.json',import.meta.url),'utf8'));
const api=process.env.EXPO_PUBLIC_BLACKBOOK_API_URL?.trim()||defaults.apiUrl;
const auth=process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()||defaults.authUrl;
const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()||defaults.publishableKey;
for(const value of [api,auth]){const url=new URL(value);assert.equal(url.protocol,'https:','Release connections must use HTTPS');assert.ok(!url.username&&!url.password&&!/localhost|\.test$|example\./.test(url.hostname),'Release connection must be a real service');}
assert.ok(key.startsWith('sb_publishable_'),'Mobile must use a public publishable key, never service-role credentials');
assert.equal(Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()),Boolean(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()),'Override the auth URL and publishable key together');
console.log('Release connection verified: public HTTPS API, Supabase URL and publishable client key.');
