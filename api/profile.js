// api/profile.js - Secure Server-Side Profile Validator
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });

    // Retrieve security credentials from incoming authorization request headers
    const secureToken = req.headers.authorization?.split(' ')[1];
    const userId = req.query.userId;

    // SECURE ENVIRONMENTAL VARIABLES: Kept isolated on the server side
    const dbUrl = (process.env.FIREBASE_BASE_URL || "https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app").replace(/\/$/, "");

    if (!secureToken || !userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized access sequence intercepted.' });
    }

    try {
        // Fetch matching profile schema securely
        const dbResponse = await fetch(`${dbUrl}/users/${userId}.json?auth=${secureToken}`);
        if (!dbResponse.ok) throw new Error("Database validation failure.");
        
        const profile = await dbResponse.json();
        if (!profile) {
            return res.status(404).json({ success: false, message: 'User profile node non-existent.' });
        }

        // Return profile configuration safely without exposing system root keys
        return res.status(200).json({
            success: true,
            name: profile.name || "Scholar",
            role: profile.role || "student",
            status: profile.status || "active",
            gameMetrics: profile.gameMetrics || { totalXP: 0, currentLevel: 1 }
        });

    } catch (error) {
        console.error("Profile Endpoint Fault:", error.message);
        return res.status(500).json({ success: false, message: 'Internal validation failure.' });
    }
};
