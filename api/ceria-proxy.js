// File: /api/ceria-proxy.js
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Ceria Specific Configuration
  const BASE_URL = "https://get.perfecttv.net/"; 
  const MANIFEST_URL = "https://get.perfecttv.net/dash2.mpd?username=vip_r92bmh1k&password=yb3IpqrB&channel=ceria";

  const { searchParams } = new URL(req.url);
  const segmentName = searchParams.get('segment');
  
  // Decide if we are fetching the manifest or a specific segment
  const targetUrl = segmentName ? (BASE_URL + segmentName) : MANIFEST_URL;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 v3 (Linux; Android 9)',
        'Accept-Encoding': 'gzip',
        'Connection': 'Keep-Alive'
      }
    });

    if (!response.ok) {
      return new Response(`Ceria Source Error: ${response.status}`, { status: response.status });
    }

    // Force application/dash+xml for the manifest to prevent Shaka Error 4000
    const contentType = segmentName 
      ? (response.headers.get('content-type') || 'application/octet-stream')
      : 'application/dash+xml';

    return new Response(response.body, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': contentType,
        'Cache-Control': segmentName ? 'public, max-age=3600' : 'no-store',
      },
    });
  } catch (error) {
    return new Response("Proxy Error: " + error.message, { status: 500 });
  }
}
