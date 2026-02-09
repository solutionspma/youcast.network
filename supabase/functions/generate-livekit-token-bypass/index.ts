import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { AccessToken } from 'npm:livekit-server-sdk@1.2.7'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  console.log('🔑 LiveKit token bypass request received');
  
  try {
    // Get request body
    const { roomName, participantName, isPublisher = false } = await req.json()

    // Validate required parameters
    if (!roomName || !participantName) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: roomName and participantName are required' 
        }),
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
          },
        }
      )
    }

    console.log('🎬 Generating token for room:', roomName, 'participant:', participantName, 'publisher:', isPublisher);

    // Get LiveKit credentials from environment
    const livekitApiKey = Deno.env.get('LIVEKIT_API_KEY')
    const livekitApiSecret = Deno.env.get('LIVEKIT_API_SECRET')

    if (!livekitApiKey || !livekitApiSecret) {
      console.error('LiveKit credentials not configured')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
          },
        }
      )
    }

    // Create access token
    const livekitToken = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: participantName,
      name: participantName,
    })

    // Set permissions based on role
    livekitToken.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: isPublisher,
      canPublishData: true,
      canSubscribe: true,
    })

    // Generate JWT token
    const jwt = await livekitToken.toJwt()

    console.log('✅ Token generated successfully, length:', jwt.length);

    return new Response(
      JSON.stringify({ 
        token: jwt,
        serverUrl: Deno.env.get('LIVEKIT_URL') || ''
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
        },
      }
    )
  } catch (error) {
    console.error('Error generating LiveKit token:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate token',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
        },
      }
    )
  }
})
