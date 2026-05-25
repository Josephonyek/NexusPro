// This runs strictly on the backend server/serverless environment
export default async function handler(req, res) {
    // Only allow POST requests for login
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Fetch your secure API key from the server environment variables (.env)
        const firebaseApiKey = process.env.FIREBASE_API_KEY;
        const firebaseEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`;

        // Make the request to Firebase from the backend
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

        // If Firebase returns an error, pass it safely to the frontend
        if (!response.ok) {
            let userMessage = "Authentication failed.";
            if (data.error && data.error.message === "INVALID_PASSWORD" || data.error.message === "EMAIL_NOT_FOUND") {
                userMessage = "Invalid email or password.";
            }
            return res.status(response.status).json({ error: userMessage });
        }

        // Send back ONLY the tokens and user ID. The API key never leaves the backend!
        return res.status(200).json({
            success: true,
            userId: data.localId,
            token: data.idToken,
            expiresIn: data.expiresIn
        });

    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
