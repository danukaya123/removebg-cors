export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({
    status: 'operational',
    service: 'CORS Proxy for Background Remover',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      '/api/proxy': 'Generic CORS proxy',
      '/api/image-process': 'Direct image processing',
      '/api/status': 'Service status'
    }
  });
}
