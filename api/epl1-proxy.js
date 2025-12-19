export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const BASE_URL = "https://load.perfecttv.net/mpd/epl1/";
  const MANIFEST_URL = `${BASE_URL}manifest.mpd?username=vip_r92bmh1k&password=yb3IpqrB&channel=epl1fhd`;

  const { searchParams, origin, pathname } = new URL(req.url);
  const segmentName = searchParams.get('segment');
  const targetUrl = segmentName ? (BASE_URL + segmentName) : MANIFEST_URL;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/132.0.0.0 Safari/537.36',
        'Referer': 'https://load.perfecttv.net/',
      }
    });

    if (!response.ok) return new Response(`Source Error`, { status: response.status });

    // Handle Manifest (.mpd) specifically
    if (!segmentName) {
      let manifestText = await response.text();
      
      // Inject BaseURL so the player knows to request segments through YOUR proxy
      // This points the player back to /api/epl1-proxy?segment=
      const proxyBaseUrl = `${origin}${pathname}?segment=`;
      
      if (manifestText.includes('<BaseURL>')) {
        manifestText = manifestText.replace(/<BaseURL>.*?<\/BaseURL>/g, `<BaseURL>${proxyBaseUrl}</BaseURL>`);
      } else {
        manifestText = manifestText.replace('<Period', `<BaseURL>${proxyBaseUrl}</BaseURL><Period`);
      }

      return new Response(manifestText, {
        headers: {
          'Content-Type': 'application/dash+xml',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    // Handle Segments
    const newHeaders = new Headers();
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    newHeaders.set('Cache-Control', 'public, max-age=3600');
    
    // Crucial for video: pass through the content length if available
    if (response.headers.has('content-length')) {
      newHeaders.set('Content-Length', response.headers.get('content-length'));
    }

    return new Response(response.body, {
      status: 200,
      headers: newHeaders,
    });

  } catch (error) {
    return new Response("Proxy Error: " + error.message, { status: 500 });
  }
}
