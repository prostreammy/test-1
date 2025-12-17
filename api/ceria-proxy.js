// File: /api/citra-proxy.js

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get('channel') || 'astrocitra';
  const segmentName = searchParams.get('segment');

  // Dynamic configuration based on channel
  let baseUrl = "https://get.perfecttv.net/citra/";
  let manifestUrl = `https://get.perfecttv.net/citra/citra.mpd?username=vip_r92bmh1k&password=yb3IpqrB&channel=${channel}`;

  if (channel === 'ceria') {
    baseUrl = "https://get.perfecttv.net/"; // Ceria segments are often at the root or relative to dash2.mpd
    manifestUrl = "https://get.perfecttv.net/dash2.mpd?username=vip_r92bmh1k&password=yb3IpqrB&channel=ceria";
  }

  const targetUrl = segmentName ? (baseUrl + segmentName) : manifestUrl;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 v3 (Linux; Android 9)',
        'Accept-Encoding': 'gzip'
      }
    });

    if (!response.ok) {
      return new Response(`Source Error: ${response.status}`, { status: response.status });
    }

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
