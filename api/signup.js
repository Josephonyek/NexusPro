// api/signup.js - Secure REST Framework (No Service Account Required)
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const { fullName, email, hashedPassword } = req.body;
    const apiKey = process.env.FIREBASE_PUBLIC_API_KEY;
    const dbUrl = process.env.FIREBASE_DATABASE_URL?.replace(/\/$/, "");

    try {
        if (!apiKey || !dbUrl) {
            throw new Error("Missing FIREBASE_PUBLIC_API_KEY or FIREBASE_DATABASE_URL on Vercel settings.");
        }

        // 1. Create the user authentication node via Firebase Identity REST Endpoint
        const authFetch = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: hashedPassword, returnSecureToken: true })
        });

        const authData = await authFetch.json();
        if (!authFetch.ok) throw new Error(authData.error?.message || "Auth sign-up rejected.");

        const userId = authData.localId;
        const idToken = authData.idToken;

        // 2. Write the profile data directly to Realtime Database via REST REST API
        // We pass the new token (?auth=) to bypass your strict security rules instantly!
        const dbFetch = await fetch(`${dbUrl}/users/${userId}.json?auth=${idToken}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: fullName,
                role: "student",
                status: "active",
                gameMetrics: { totalXP: 0, currentLevel: 1 }
            })
        });

        if (!dbFetch.ok) {
            const dbErrLog = await dbFetch.text();
            console.error("Database initialization failed:", dbErrLog);
            throw new Error("Auth passed, but database node provisioning was rejected.");
        }

        return res.status(200).json({ 
            success: true, 
            token: idToken, 
            userId: userId,
            role: "student"
        });

    } catch (error) {
        console.error("Signup Endpoint Crash:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};
