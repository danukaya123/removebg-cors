export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({
      error: 'Missing URL parameter',
      usage: '/api/proxy?url=https://example.com/api/endpoint'
    });
  }

  try {
    const headers = { ...req.headers };
    
    // Remove headers that might cause issues
    delete headers.host;
    delete headers.origin;
    delete headers.referer;
    
    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    // Handle request body
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = req.body;
    }

    const response = await fetch(targetUrl, fetchOptions);
    
    // Get response content type
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
