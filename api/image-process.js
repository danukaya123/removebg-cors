const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const HF_SPACE_URL = "https://danuka21-quizontal-background-remover-c1.hf.space";
    
    // Handle multipart form data for file uploads
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    const response = await fetch(`${HF_SPACE_URL}/process_image`, {
      method: 'POST',
      body: req.body,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      },
      timeout: 60000
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // Return the processed image data
    res.status(200).json({
      success: true,
      data: result.data,
      message: 'Image processed successfully'
    });
    
  } catch (error) {
    console.error('Image processing error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Image processing failed',
      message: error.message
    });
  }
};
