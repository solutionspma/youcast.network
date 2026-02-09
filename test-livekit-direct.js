#!/usr/bin/env node

// Direct LiveKit connection test - bypasses Supabase entirely
const { AccessToken } = require('livekit-server-sdk');

const API_KEY = 'APIuUsX8vGgGF7n';
const API_SECRET = 'g2UobPW3iCAVv0qreLUXX7W1v1cjhBGOztZgnO0zJ5w';
const LIVEKIT_URL = 'wss://youcast-yxcegry8.livekit.cloud';
const ROOM_NAME = 'test-room-' + Date.now();
const PARTICIPANT_NAME = 'test-broadcaster';

console.log('🧪 Testing LiveKit Direct Connection...\n');
console.log('LiveKit Server:', LIVEKIT_URL);
console.log('Room:', ROOM_NAME);
console.log('Participant:', PARTICIPANT_NAME);
console.log('---\n');

(async () => {
  try {
    // Generate token
    const token = new AccessToken(API_KEY, API_SECRET, {
      identity: PARTICIPANT_NAME,
      name: PARTICIPANT_NAME,
    });

    token.addGrant({
      room: ROOM_NAME,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();
    
    console.log('✅ Token generated successfully!');
    console.log('Token length:', jwt.length, 'characters\n');
    console.log('Token:', jwt.substring(0, 50) + '...\n');
    
    console.log('🎯 Use this to connect:');
    console.log('---');
    console.log('URL:', LIVEKIT_URL);
    console.log('Token:', jwt);
    console.log('---\n');
    
    console.log('💡 To test in browser:');
    console.log('1. Go to https://meet.livekit.io');
    console.log('2. Click "Custom Server"');
    console.log('3. Enter the URL and token above');
    console.log('\nOR copy this entire connection URL:');
    console.log(`${LIVEKIT_URL}?token=${jwt}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
