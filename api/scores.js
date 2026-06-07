// api/scores.js

export default async function handler(req, res) {
  // Pull parameters from frontend query string, defaulting to soccer/EPL if left empty
  const { sport = 'soccer', league = 'eng.1' } = req.query;
  
  // Access environment variables securely injected via your system setup
  const baseUrl = process.env.ESPN_API_BASE_URL || 'https://site.api.espn.com/apis/site/v2/sports';

  try {
    const apiResponse = await fetch(`${baseUrl}/${sport}/${league}/scoreboard`);
    
    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({ 
        error: `External endpoint responded with status code: ${apiResponse.status}` 
      });
    }

    const data = await apiResponse.json();

    // Cache responses to prevent overloading endpoints during major game matches
    // s-maxage=15 tells Vercel to cache data for 15 seconds safely on their global CDN
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=45');
    
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ 
      error: 'Internal routing connection failure', 
      details: err.message 
    });
  }
}
