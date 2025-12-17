// File: /api/ceria-proxy.js

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const BASE_URL = "https://get.perfecttv.net/ceria/";
  const MANIFEST_URL = "https://get.perfecttv.net/dash2.mpd?username=vip_r321dmh1k&password=yr431pqrB&channel=ceria ";

  const { searchParams } = new URL(req.url);
  const segmentName = searchParams.get('segment');
  
  // If segment is requested, append it to base. Otherwise, load the main manifest.
  const targetUrl = segmentName ? (BASE_URL + segmentName) : MANIFEST_URL;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 9; TV)'
      }
    });

    if (!response.ok) {
      return new Response(`Source Error: ${response.status}`, { status: response.status });
    }

    // Determine the correct Content-Type
    // Forcing application/dash+xml for the manifest fixes parsing issues
    const contentType = segmentName 
      ? (response.headers.get('content-type') || 'application/octet-stream')
      : 'application/dash+xml';

    return new Response(response.body, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': contentType,
        'Cache-Control': segmentName ? 'public, max-age=3600' : 'no-store',
      },
    });
  } catch (error) {
    return new Response("Proxy Error: " + error.message, { status: 500 });
  }
}
