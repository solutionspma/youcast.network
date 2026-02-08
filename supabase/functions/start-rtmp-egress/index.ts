import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY')!;
const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET')!;
const LIVEKIT_URL = Deno.env.get('LIVEKIT_URL')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RtmpDestination {
  id: string;
  platform: string;
  name: string;
  rtmp_url: string;
  stream_key: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { roomName, channelId } = await req.json();

    if (!roomName || !channelId) {
      return new Response(
        JSON.stringify({ error: 'Missing roomName or channelId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get streaming destinations from Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: destinations, error: dbError } = await supabase
      .from('streaming_destinations')
      .select('*')
      .eq('channel_id', channelId)
      .eq('is_enabled', true);

    if (dbError) {
      console.error('Failed to fetch destinations:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch streaming destinations' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!destinations || destinations.length === 0) {
      return new Response(
        JSON.stringify({ success: true, egressIds: [], message: 'No enabled destinations' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Start RTMP egress for each destination
    const egressIds: Record<string, string> = {};
    const errors: Record<string, string> = {};

    for (const dest of destinations as RtmpDestination[]) {
      try {
        // Create LiveKit RTMP egress
        const egressResponse = await fetch(`${LIVEKIT_URL}/twirp/livekit.Egress/StartRoomCompositeEgress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await generateEgressToken()}`,
          },
          body: JSON.stringify({
            room_name: roomName,
            layout: 'speaker-dark',
            audio_only: false,
            video_only: false,
            custom_base_url: '',
            outputs: {
              rtmp: [{
                urls: [`${dest.rtmp_url}/${dest.stream_key}`]
              }]
            }
          }),
        });

        if (!egressResponse.ok) {
          const errorText = await egressResponse.text();
          console.error(`Failed to start egress for ${dest.name}:`, errorText);
          errors[dest.id] = errorText;
          continue;
        }

        const egressData = await egressResponse.json();
        egressIds[dest.id] = egressData.egress_id;

        // Update destination status
        await supabase
          .from('streaming_destinations')
          .update({ 
            is_connected: true,
            last_stream_at: new Date().toISOString()
          })
          .eq('id', dest.id);

      } catch (error) {
        console.error(`Error starting egress for ${dest.name}:`, error);
        errors[dest.id] = String(error);
      }
    }

    return new Response(
      JSON.stringify({
        success: Object.keys(egressIds).length > 0,
        egressIds,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', 
        },
      }
    );

  } catch (error) {
    console.error('Egress start error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
});

// Generate egress token using JWT
async function generateEgressToken(): Promise<string> {
  const encoder = new TextEncoder();
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: LIVEKIT_API_KEY,
    sub: LIVEKIT_API_KEY,
    nbf: now,
    exp: now + 3600, // 1 hour
    video: {
      canPublish: true,
      canSubscribe: true,
      roomCreate: true,
      roomList: true,
      roomAdmin: true,
    }
  };

  const base64Header = btoa(JSON.stringify(header));
  const base64Payload = btoa(JSON.stringify(payload));
  const signatureInput = `${base64Header}.${base64Payload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(LIVEKIT_API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signatureInput)
  );

  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${signatureInput}.${base64Signature}`;
}
