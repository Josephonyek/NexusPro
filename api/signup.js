// api/signup.js - Production Ready with Cloud Fallbacks
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const { fullName, email, hashedPassword } = req.body;
    
    // HARDCODED FALLBACKS: If Vercel's environment variables are missing, use these directly
    const apiKey = process.env.FIREBASE_API_KEY || "AIzaSyDbt1wfOLhRls_JG2ysysfHvqRBL8LRpBI"; 
    const dbUrl = (process.env.FIREBASE_BASE_URL || "https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app").replace(/\/$/, "");

    try {
        // 1. Create entry profile
        const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: hashedPassword, returnSecureToken: true })
        });

        const authData = await authResponse.json();
        if (!authResponse.ok) throw new Error(authData.error?.message || "Sign-up rejected.");

        const userId = authData.localId;
        const idToken = authData.idToken;

        // 2. Initialize database record node
        const dbResponse = await fetch(`${dbUrl}/users/${userId}.json?auth=${idToken}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: fullName,
                role: "student",
                status: "active",
                gameMetrics: { totalXP: 0, currentLevel: 1 }
            })
        });

        if (!dbResponse.ok) {
            throw new Error("Identity verified, but database entry initialization failed.");
        }

        return res.status(200).json({ 
            success: true, 
            token: idToken, 
            userId: userId,
            role: "student"
        });

    } catch (error) {
        console.error("Signup Endpoint Fault:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};
