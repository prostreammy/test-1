export default async function handler(req, res) {
  const targetUrl = 'https://get.perfecttv.net/dash2.mpd?username=vip_r92bmh1k&password=yb3IpqrB&channel=ceria';

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 v3 (Linux; Android 9)',
        'Host': 'get.perfecttv.net',
        'Connection': 'Keep-Alive'
      }
    });

    const data = await response.text();

    res.setHeader('Content-Type', 'application/dash+xml');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allows your HTML to read it
    return res.status(200).send(data);
  } catch (error) {
    return res.status(500).send('Error fetching stream');
  }
}
