export const config = {
  runtime: 'edge', 
};

export default async function handler(req) {
  const t0 = Date.now();
  
  const BASE_URL = "https://load.perfecttv.net/mpd/epl1/";
  const MANIFEST_URL = "https://load.perfecttv.net/mpd/epl1/manifest.mpd?username=vip_r92bmh1k&password=yb3IpqrB&channel=epl1fhd";

  const { searchParams } = new URL(req.url);
  const segmentName = searchParams.get('segment');
  const targetUrl = segmentName ? (BASE_URL + segmentName) : MANIFEST_URL;

  try {
    // 1. Fetch with optimized headers
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
        'Accept-Encoding': 'identity', // Prevents the Edge function from wasting CPU decompressing
      },
      // Keep connection alive for multiple segments
      keepalive: true,
    });

    const tFetch = Date.now() - t0;

    if (!response.ok) {
      return new Response(`Source Error: ${response.statusText}`, { status: response.status });
    }

    // 2. Setup Streaming
    // We use a TransformStream to pipe the body directly. 
    // This allows the browser to start playing as soon as the first chunk arrives.
    const { readable, writable } = new TransformStream();
    response.body.pipeTo(writable);

    // 3. Optimized Headers
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
      // Dynamic Caching: Segments are static (cache), Manifests are dynamic (don't cache)
      'Cache-Control': segmentName 
        ? 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=60' 
        : 'no-store, no-cache, must-revalidate',
      // Performance Tracking
      'Server-Timing': `fetch;dur=${tFetch};desc="Origin Response"`,
      'X-Proxy-Cache': segmentName ? 'HIT' : 'MISS',
    });

    return new Response(readable, {
      status: 200,
      headers,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Proxy Error", message: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
