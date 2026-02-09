import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { AccessToken } from 'npm:livekit-server-sdk@1.2.7'
import { createClient } from 'jsr:@supabase/supabase-js@2'

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

  console.log('🔑 LiveKit token request received');
  
  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    console.log('🔍 Auth header present:', !!authHeader);
    console.log('🔍 Auth header value:', authHeader ? authHeader.substring(0, 20) + '...' : 'null');
    
    if (!authHeader) {
      console.log('❌ Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
          },
        }
      )
    }

    // Extract token from Bearer header
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!bearerToken) {
      console.log('❌ Invalid authorization header format');
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header format' }),
        {
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
          },
        }
      )
    }
    
    console.log('🔍 Verifying JWT token...');

    // Verify JWT token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${bearerToken}` } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        {
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
          },
        }
      )
    }
    
    if (!user) {
      console.log('❌ No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
          },
        }
      )
    }
    
    console.log('✅ User authenticated:', user.id);

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
