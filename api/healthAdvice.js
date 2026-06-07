// api/healthAdvice.js

export default async function handler(req, res) {
  const { type = 'recommendations', age = '25', sex = 'male', keyword = '' } = req.query;
  const baseUrl = 'https://odphp.health.gov/myhealthfinder/api/v4';
  const gnewsApiKey = process.env.GNEWS_API_KEY;

  try {
    // NEW UPDATED MODE: Verified Global Health News via GNews API
    if (type === 'news') {
      if (!gnewsApiKey) {
        return res.status(500).json({ error: 'GNEWS_API_KEY environment variable is missing on Vercel' });
      }

      // Querying specifically for health topics, sorted by latest articles
      const newsUrl = `https://gnews.io/api/v4/top-headlines?category=health&lang=en&apikey=${gnewsApiKey}`;
      
      const newsResponse = await fetch(newsUrl);
      if (!newsResponse.ok) throw new Error(`GNews responded with status: ${newsResponse.status}`);
      
      const newsData = await newsResponse.json();
      
      // Cache news results on Vercel Edge for 1 hour to protect your daily free tier limits
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800');
      return res.status(200).json(newsData);
    }

    // Existing Clinical Advice and Keyword Search Modes
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
    return res.status(500).json({ error: 'Failed to execute query mapping', details: err.message });
  }
        }
