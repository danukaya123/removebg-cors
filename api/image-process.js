export default async function handler(req, res) {
  // Set CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed. Only POST requests are supported.' 
    });
  }

  try {
    const HF_SPACE_URL = "https://not-lain-background-removal.hf.space";
    
    console.log('Received image processing request');

    // For Vercel serverless functions, we need to handle the raw body
    const response = await fetch(`${HF_SPACE_URL}/process_image`, {
      method: 'POST',
      body: req.body,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
      },
    });

    console.log('Hugging Face response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      throw new Error(`Hugging Face API returned ${response.status}`);
    }

    const result = await response.json();
    console.log('Hugging Face response received');
    
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
}
