const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const HF_SPACE_URL = "https://danuka21-quizontal-background-remover-c1.hf.space";
    const endpoint = "/process_image";
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
    };

    const fetchOptions = {
      method: 'POST',
      headers: headers,
      timeout: 60000
    };

    // Handle file upload
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      fetchOptions.body = req.body;
    } else if (req.body) {
      headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(req.body);
    }

    console.log('Forwarding request to Hugging Face:', `${HF_SPACE_URL}${endpoint}`);
    
    const response = await fetch(`${HF_SPACE_URL}${endpoint}`, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Hugging Face API responded with status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.status(200).json(data);
    } else {
      const text = await response.text();
      res.status(200).send(text);
    }
    
  } catch (error) {
    console.error('Hugging Face proxy error:', error);
    
    res.status(500).json({
      error: 'Failed to process image',
      message: error.message,
      suggestion: 'Please try again in a few moments'
    });
  }
};
