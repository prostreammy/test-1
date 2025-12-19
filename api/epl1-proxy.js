export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const segment = searchParams.get('segment');

  // The true base of the provider's file structure
  const REMOTE_BASE = "https://load.perfecttv.net/mpd/epl1/";
  
  // 1. Determine Target URL
  // If segment is provided, we fetch the segment. Otherwise, the manifest.
  const targetUrl = segment 
    ? `${REMOTE_BASE}${segment}` 
    : `${REMOTE_BASE}manifest.mpd?username=vip_r92bmh1k&password=yb3IpqrB&channel=epl1fhd`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://load.perfecttv.net/',
        'Origin': 'https://load.perfecttv.net'
      },
    });

    // If the provider returns a 404, we need to know immediately
    if (!response.ok) {
      console.error(`Fetch failed for ${targetUrl}: ${response.status}`);
      return new Response(null, { status: response.status });
    }

    // 2. Clone and Clean Headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', '*');
    
    // Explicitly set types for DRM/DASH
    if (targetUrl.includes('.mpd')) {
      newHeaders.set('Content-Type', 'application/dash+xml');
      newHeaders.set('Cache-Control', 'no-cache');
    } else {
      newHeaders.set('Cache-Control', 'public, max-age=3600');
    }

    // 3. Stream response
    return new Response(response.body, {
      status: 200,
      headers: newHeaders,
    });

  } catch (e) {
    return new Response("Proxy Error", { status: 500 });
  }
}
