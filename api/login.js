// Secure backend function for handling user authentication
export default async function handler(req, res) {
    // Only allow POST requests for user authentication
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Pulls your secret API key safely from your environment configuration settings 
        // (You will add AIzaSyDbt1wfOLhRls_JG2ysysfHvqRBL8LRpBI into your host dashboard settings)
        const firebaseApiKey = process.env.FIREBASE_API_KEY;
        
        // Target endpoint utilizing your specific app's context
        const firebaseEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`;

        // Send credentials securely from the serverless backend straight to Google
        const response = await fetch(firebaseEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                returnSecureToken: true
            })
        });

        const data = await response.json();

        // Catch backend error codes and map clean notices back to your phone UI
        if (!response.ok) {
            let userMessage = "Authentication failed.";
            if (data.error && (data.error.message === "INVALID_PASSWORD" || data.error.message === "EMAIL_NOT_FOUND")) {
                userMessage = "Invalid email or password.";
            } else if (data.error && data.error.message === "USER_DISABLED") {
                userMessage = "This student account has been disabled.";
            }
            return res.status(response.status).json({ error: userMessage });
        }

        // Return token maps to your vanilla JS layer. Your API key remains completely hidden!
        return res.status(200).json({
            success: true,
            userId: data.localId,
            token: data.idToken,
            expiresIn: data.expiresIn,
            projectId: "nexuspro-cf948" // Explicit tracking for your dashboard configurations
        });

    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
