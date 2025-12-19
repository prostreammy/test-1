export const config = {
  runtime: 'edge', // Runs closer to the user, faster startup
};

export default async function handler(req) {
  const BASE_URL = "https://load.perfecttv.net/mpd/badminton/";
  const MANIFEST_URL = "https://load.perfecttv.net/mpd/badminton/manifest.mpd?username=vip_r92bmh1k&password=yb3IpqrB&channel=badmintonfhd";

  const { searchParams } = new URL(req.url);
  const segmentName = searchParams.get('segment');
  
  const targetUrl = segmentName ? (BASE_URL + segmentName) : MANIFEST_URL;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
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
