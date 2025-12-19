export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const BASE_URL = "https://load.perfecttv.net/mpd/epl1/";
  const MANIFEST_URL = `${BASE_URL}manifest.mpd?username=vip_r92bmh1k&password=yb3IpqrB&channel=epl1fhd`;

  const { searchParams, origin, pathname } = new URL(req.url);
  const segmentName = searchParams.get('segment');
  const targetUrl = segmentName ? (BASE_URL + segmentName) : MANIFEST_URL;

  // Abort controller to close the connection to source if the user leaves
  const controller = new AbortController();
  
  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/132.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Connection': 'keep-alive' // Ask source to keep connection open
      }
    });

    if (!response.ok) return new Response("Error", { status: response.status });

    // MANIFEST HANDLING (Requires modification)
    if (!segmentName) {
      let manifest = await response.text();
      const proxyBase = `${origin}${pathname}?segment=`;
      
      // Ensure the player routes segments back through the proxy
      manifest = manifest.includes('<BaseURL>') 
        ? manifest.replace(/<BaseURL>.*?<\/BaseURL>/, `<BaseURL>${proxyBase}</BaseURL>`)
        : manifest.replace('<Period', `<BaseURL>${proxyBase}</BaseURL><Period`);

      return new Response(manifest, {
        headers: { 
            'Content-Type': 'application/dash+xml',
            'Access-Control-Allow-Origin': '*' 
        }
      });
    }

    // SEGMENT HANDLING (Ultra-fast streaming)
    // We pass the response.body (ReadableStream) directly.
    // This allows the browser to start receiving data while the proxy is still downloading it.
    return new Response(response.body, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': response.headers.get('content-type') || 'video/iso.segment',
        'Content-Length': response.headers.get('content-length'),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=60',
        'X-Content-Type-Options': 'nosniff'
      },
    });

  } catch (e) {
    return new Response("Timeout/Error", { status: 504 });
  }
}
