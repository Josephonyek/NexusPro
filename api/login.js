// api/login.js - Production Ready with Cloud Fallbacks
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const { email, hashedPassword } = req.body;
    
    // HARDCODED FALLBACKS: If Vercel's environment variables are missing, use these directly
    const apiKey = process.env.FIREBASE_API_KEY || "AIzaSyDbt1wfOLhRls_JG2ysysfHvqRBL8LRpBI"; 
    const dbUrl = (process.env.FIREBASE_BASE_URL || "https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app").replace(/\/$/, "");

    try {
        // 1. Authenticate credentials
        const identityResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: hashedPassword, returnSecureToken: true }),
        });

        const identityData = await identityResponse.json();
        if (!identityResponse.ok) throw new Error(identityData.error?.message || "Invalid Email or Password credentials.");

        const userId = identityData.localId;
        const idToken = identityData.idToken;

        // 2. Clear user state validation
        const dbResponse = await fetch(`${dbUrl}/users/${userId}.json?auth=${idToken}`);
        const profile = dbResponse.ok ? await dbResponse.json() : null;
        
        const activeRole = profile?.role || 'student';
        const accountStatus = profile?.status || 'active';

        if (accountStatus === 'banned' || accountStatus === 'suspended') {
            return res.status(403).json({ success: false, message: '🔒 This account has been suspended.' });
        }

        return res.status(200).json({
            success: true,
            token: idToken,
            userId: userId,
            role: activeRole
        });

    } catch (error) {
        console.error("Login Endpoint Fault:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};
