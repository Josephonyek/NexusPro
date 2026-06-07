// api/healthAdvice.js

export default async function handler(req, res) {
  const { type = 'recommendations', age = '25', sex = 'male', keyword = '' } = req.query;
  const baseUrl = process.env.HEALTH_API_BASE_URL || 'https://odphp.health.gov/myhealthfinder/api/v4';

  try {
    let targetUrl = '';

    if (type === 'search') {
      // Endpoint for keyword lookup
      targetUrl = `${baseUrl}/topicsearch.json?keyword=${encodeURIComponent(keyword)}`;
    } else {
      // Endpoint for daily personalized updates
      targetUrl = `${baseUrl}/myhealthfinder.json?age=${age}&sex=${sex}`;
    }

    const apiResponse = await fetch(targetUrl);
    
    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({ error: `External Health API error status: ${apiResponse.status}` });
    }

    const data = await apiResponse.json();

    // Cache health advice on Vercel for 1 day to make page loads blazing fast
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: 'Failed to complete server connection', details: err.message });
  }
}
