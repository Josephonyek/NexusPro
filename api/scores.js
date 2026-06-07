// api/scores.js

export default async function handler(req, res) {
  const { type = 'scores', sport = 'soccer', league = 'eng.1' } = req.query;
  const baseUrl = process.env.ESPN_API_BASE_URL || 'https://site.api.espn.com/apis/site/v2/sports';

  try {
    // Action 1: Fetch News & Videos Feed
    if (type === 'news') {
      let newsUrl = `${baseUrl}/${sport}/${league}/news`;
      
      // Special case: If user wants FIFA news, ESPN handles international news via 'soccer/fifa.world'
      if (league === 'fifa') {
        newsUrl = `${baseUrl}/soccer/fifa.world/news`;
      }

      const newsResponse = await fetch(newsUrl);
      if (!newsResponse.ok) throw new Error('Failed to grab sports news feed');
      
      const newsData = await newsResponse.json();
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120'); // Cache news longer than scores
      return res.status(200).json(newsData);
    }

    // Action 2: Fetch Live Match Scores (Default)
    const scoreResponse = await fetch(`${baseUrl}/${sport}/${league}/scoreboard`);
    if (!scoreResponse.ok) throw new Error('Failed to grab scoreboard details');
    
    const scoreData = await scoreResponse.json();
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=45');
    return res.status(200).json(scoreData);

  } catch (err) {
    return res.status(500).json({ error: 'Server Connection Error', details: err.message });
  }
}
