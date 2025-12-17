export default async function handler(req, res) {
  const targetUrl = 'https://get.perfecttv.net/dash2.mpd?username=vip_r92bmh1k&password=yb3IpqrB&channel=ceria';

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 v3 (Linux; Android 9)',
        'Accept-Encoding': 'gzip'
      }
    });

    if (!response.ok) {
      return res.status(response.status).send('Error fetching manifest');
    }

    const data = await response.text();

    // Set headers to allow the player to read the manifest
    res.setHeader('Content-Type', 'application/dash+xml');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=6, stale-while-revalidate');

    return res.status(200).send(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to proxy request' });
  }
}
