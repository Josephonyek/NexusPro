// api/healthAdvice.js

export default async function handler(req, res) {
  const { type = 'recommendations', age = '25', sex = 'male', keyword = '' } = req.query;
  const baseUrl = process.env.HEALTH_API_BASE_URL || 'https://odphp.health.gov/myhealthfinder/api/v4';

  try {
    // NEW MODE: Breaking Health News & Articles
    if (type === 'news') {
      // Fetching live articles from a major health news wire converted cleanly to JSON
      const newsFeedUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.medicalnewstoday.com%2Ffeed%2Frss';
      
      const newsResponse = await fetch(newsFeedUrl);
      if (!newsResponse.ok) throw new Error('Health news wire failed to respond');
      
      const newsData = await newsResponse.json();
      
      // Cache news items for 30 minutes (1800 seconds)
      res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=900');
      return res.status(200).json(newsData);
    }

    // Existing modes: Search and Daily recommendations
    let targetUrl = '';
    if (type === 'search') {
      targetUrl = `${baseUrl}/topicsearch.json?keyword=${encodeURIComponent(keyword)}`;
    } else {
      targetUrl = `${baseUrl}/myhealthfinder.json?age=${age}&sex=${sex}`;
    }

    const apiResponse = await fetch(targetUrl);
    if (!apiResponse.ok) throw new Error(`Health API error status: ${apiResponse.status}`);

    const data = await apiResponse.json();
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: 'Failed to complete server connection', details: err.message });
  }
}
