// File: /api/ceria-proxy.js

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const MANIFEST_URL = "https://get.perfecttv.net/dash2.mpd?username=vip_r92bmh1k&password=yb3IpqrB&channel=ceria";
  const LICENSE_URL = "https://linearjitp-playback.astro.com.my/widevine/getlicense";

  const { searchParams } = new URL(req.url);
  const segmentUrl = searchParams.get('url');
  const isLicenseRequest = searchParams.get('type') === 'license';

  let targetUrl;
  let options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 v3 (Linux; Android 9)'
    }
  };

  try {
    if (isLicenseRequest) {
      targetUrl = LICENSE_URL;
      options.method = 'POST';
      
      // FIX: Forward ALL headers from the player's request to the license server
      const playerHeaders = Object.fromEntries(req.headers.entries());
      options.headers = playerHeaders;

      // Copy the body from the player's request
      options.body = req.body;
    } else if (segmentUrl) {
      targetUrl = decodeURIComponent(segmentUrl);
    } else {
      targetUrl = MANIFEST_URL;
    }
    
    console.log(`[PROXY] Fetching: ${targetUrl}`);
    if (isLicenseRequest) {
        console.log(`[PROXY] License request headers:`, options.headers);
    }

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

    if (isLicenseRequest) {
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
