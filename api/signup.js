// api/signup.js - Connected directly to your Vercel Variables
module.exports = async function handler(req, res) {
    // Set explicit security CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const { fullName, email, hashedPassword } = req.body;
    
    // MATCHING YOUR VERCEL PANEL SCREENSHOT:
    const apiKey = process.env.FIREBASE_API_KEY; 
    const dbUrl = process.env.FIREBASE_BASE_URL?.replace(/\/$/, "");

    try {
        if (!apiKey || !dbUrl) {
            throw new Error("Missing variable mapping links inside the Vercel cloud dashboard container setup.");
        }

        // 1. Create user account profile via client identification gateway endpoints
        const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: hashedPassword, returnSecureToken: true })
        });

        const authData = await authResponse.json();
        if (!authResponse.ok) throw new Error(authData.error?.message || "Sign-up rejected by authentication console.");

        const userId = authData.localId;
        const idToken = authData.idToken;

        // 2. Provision authenticated database records using the structural token parameter pathing context
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
            throw new Error("Identity verified successfully, but user profile node creation failed database validation checks.");
        }

        return res.status(200).json({ 
            success: true, 
            token: idToken, 
            userId: userId,
            role: "student"
        });

    } catch (error) {
        console.error("Signup Endpoint Fault Intercepted:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};
