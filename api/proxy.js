const fetch = require('node-fetch');

module.exports = async (req, res) => {
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

  console.log('Proxying request to:', targetUrl);
  
  try {
    const headers = { ...req.headers };
    
    // Remove headers that might cause issues
    delete headers.host;
    delete headers.origin;
    delete headers.referer;
    delete headers['content-length'];
    
    // Ensure proper content type for file uploads
    if (headers['content-type'] && headers['content-type'].includes('multipart/form-data')) {
      delete headers['content-type'];
    }

    const fetchOptions = {
      method: req.method,
      headers: headers,
      timeout: 30000
    };

    // Handle request body
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.body) {
        if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
          fetchOptions.body = req.body;
        } else {
          fetchOptions.body = JSON.stringify(req.body);
        }
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    
    // Get response content type
    const contentType = response.headers.get('content-type');
    
    // Set response headers from target
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'set-cookie') {
        res.setHeader(key, value);
      }
    });

    // Ensure CORS headers are set
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else if (contentType && contentType.includes('image/')) {
      const buffer = await response.buffer();
      res.setHeader('Content-Type', contentType);
      return res.status(response.status).send(buffer);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    if (error.name === 'TimeoutError') {
      return res.status(504).json({
        error: 'Gateway Timeout',
        message: 'The request took too long to process'
      });
    }
    
    if (error.code === 'ENOTFOUND') {
      return res.status(502).json({
        error: 'Bad Gateway',
        message: 'Could not connect to the target server'
      });
    }
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};
