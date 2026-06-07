// api/healthAdvice.js

export default async function handler(req, res) {
  const { type = 'recommendations', age = '25', sex = 'male', keyword = '' } = req.query;
  const baseUrl = process.env.HEALTH_API_BASE_URL || 'https://odphp.health.gov/myhealthfinder/api/v4';

  try {
    let targetUrl = '';

    if (type === 'search') {
      // Keyword topic search endpoint
      targetUrl = `${baseUrl}/topicsearch.json?keyword=${encodeURIComponent(keyword)}`;
    } else {
      // General preventive recommendation endpoint
      targetUrl = `${baseUrl}/myhealthfinder.json?age=${age}&sex=${sex}`;
    }

    const apiResponse = await fetch(targetUrl);
    if (!apiResponse.ok) throw new Error(`Health API returned status: ${apiResponse.status}`);

    const data = await apiResponse.json();

    // Medical advice doesn't change by the second, cache for 1 day to ensure great speeds
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch medical data streams', details: err.message });
  }
  }
