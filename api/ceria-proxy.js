// File: /api/ceria-proxy.js

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // URLs for different content types
  const MANIFEST_URL = "https://get.perfecttv.net/dash2.mpd?username=vip_r92bmh1k&password=yb3IpqrB&channel=ceria";
  const SEGMENT_BASE_URL = "https://linearjitp-playback.astro.com.my/dash-wv/linear/2606/";
  const LICENSE_URL = "https://linearjitp-playback.astro.com.my/widevine/getlicense";

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'manifest'; // Default to manifest

  let targetUrl;
  let options = {
    headers: {
      // This User-Agent is required for the manifest and segments
      'User-Agent': 'Mozilla/5.0 v3 (Linux; Android 9)'
    }
  };

  try {
    if (type === 'manifest') {
      targetUrl = MANIFEST_URL;
    } else if (type === 'segment') {
      // The segment name is the full path from the manifest
      const segmentName = searchParams.get('segment');
      if (!segmentName) {
        return new Response("Missing segment name", { status: 400 });
      }
      targetUrl = SEGMENT_BASE_URL + segmentName;
    } else if (type === 'license') {
      // License requests are POST requests with a specific body and headers
      targetUrl = LICENSE_URL;
      options.method = req.method;
      
      // Copy the headers from the player's request
      const playerHeaders = Object.fromEntries(req.headers.entries());
      options.headers = {
        ...options.headers,
        'Content-Type': playerHeaders['content-type'] || 'application/octet-stream',
      };

      // Copy the body from the player's request
      options.body = req.body;
    } else {
      return new Response("Invalid request type", { status: 400 });
    }
    
    console.log(`[PROXY] Fetching: ${targetUrl}`);

    const response = await fetch(targetUrl, options);

    if (!response.ok) {
      console.error(`[PROXY] Source Error for ${targetUrl}: ${response.status} ${response.statusText}`);
      return new Response(`Source Error: ${response.statusText}`, { status: response.status });
    }

    // Proxy the response headers and body
    const responseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
    };

    // For licenses, the content type is crucial
    if (type === 'license') {
        responseHeaders['Content-Type'] = 'application/octet-stream';
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error(`[PROXY] Proxy Error:`, error);
    return new Response("Proxy Error: " + error.message, { status: 500 });
  }
}
