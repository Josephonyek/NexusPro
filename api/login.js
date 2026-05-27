// Secure backend function for user login and role extraction
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Pull your secret key safely from your cloud host environment variables (.env)
        const firebaseApiKey = process.env.FIREBASE_API_KEY;
        const authEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`;

        // 1. Authenticate credentials against Firebase Auth
        const authResponse = await fetch(authEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, returnSecureToken: true })
        });

        const authData = await authResponse.json();

        if (!authResponse.ok) {
            let userMessage = "Authentication failed.";
            if (authData.error && (authData.error.message === "INVALID_PASSWORD" || authData.error.message === "EMAIL_NOT_FOUND")) {
                userMessage = "Invalid email or password.";
            } else if (authData.error && authData.error.message === "USER_DISABLED") {
                userMessage = "This account has been disabled by an administrator.";
            }
            return res.status(authResponse.status).json({ error: userMessage });
        }

        const userId = authData.localId;
        const userToken = authData.idToken;

        // 2. Fetch user's role parameters from Realtime Database
        const rtdbUrl = `https://nexuspro-cf948-default-rtdb.firebaseio.com/users/${userId}.json?auth=${userToken}`;
        const rtdbResponse = await fetch(rtdbUrl, { method: 'GET' });
        
        let userRole = "student"; // Fallback default state
        
        if (rtdbResponse.ok) {
            const userData = await rtdbResponse.json();
            if (userData && userData.role) {
                userRole = userData.role; // Extracting "admin" or "student"
            }
        }

        // Return tokens and profile mapping parameters to the frontend layer
        return res.status(200).json({
            success: true,
            userId: userId,
            token: userToken,
            role: userRole
        });

    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
