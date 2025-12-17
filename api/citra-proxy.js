// File: /api/citra-proxy.js

export const config = {
  runtime: 'edge', // Runs closer to the user, faster startup
};

export default async function handler(req) {
  const BASE_URL = "https://get.perfecttv.net/citra/";
  const MANIFEST_URL = "https://get.perfecttv.net/citra/citra.mpd?username=vip_r94123k&password=yb32311rB&channel=astrocitra";

  const { searchParams } = new URL(req.url);
  const segmentName = searchParams.get('segment');
  
  const targetUrl = segmentName ? (BASE_URL + segmentName) : MANIFEST_URL;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        // Updated User-Agent as requested
        'User-Agent': 'Mozilla/5.0 v3 (Linux; Android 9)'
      }
    });

    if (!response.ok) {
      return new Response(`Source Error: ${response.statusText}`, { status: response.status });
    }

    // Proxy the headers and stream the body directly
    return new Response(response.body, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Cache-Control': segmentName ? 'public, max-age=3600' : 'no-store', // Cache segments, not manifests
      },
    });
  } catch (error) {
    return new Response("Proxy Error: " + error.message, { status: 500 });
  }
}
