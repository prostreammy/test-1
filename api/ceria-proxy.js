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
      // License requests are POST requests with a specific body and headers
      targetUrl = LICENSE_URL;
      options.method = 'POST';
      
      // Copy the essential headers from the player's request
      const playerHeaders = Object.fromEntries(req.headers.entries());
      options.headers = {
        'Content-Type': playerHeaders['content-type'],
        // Add any other headers the license server might need
      };

      // Copy the body from the player's request
      options.body = req.body;
    } else if (segmentUrl) {
      // The player provides the full segment URL
      targetUrl = decodeURIComponent(segmentUrl);
    } else {
      // Default to manifest request
      targetUrl = MANIFEST_URL;
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
