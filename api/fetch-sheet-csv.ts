export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const queryParams = req.query || {};
  let sheetUrl = (queryParams.url as string) || '';

  if (!sheetUrl && req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      sheetUrl = parsedUrl.searchParams.get('url') || '';
    } catch {
      // ignore
    }
  }

  if (!sheetUrl) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing sheet URL' }));
    return;
  }

  try {
    let fetchTarget = sheetUrl;
    if (sheetUrl.includes('docs.google.com/spreadsheets')) {
      const gidMatch = sheetUrl.match(/gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      fetchTarget = sheetUrl.replace(/\/edit.*$/, `/export?format=csv&gid=${gid}`);
    }

    const response = await fetch(fetchTarget, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });
    const text = await response.text();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(text);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Failed to fetch sheet data' }));
  }
}
