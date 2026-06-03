export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const firebaseApiKey = process.env.FIREBASE_API_KEY;   // ← Corrected

        if (!firebaseApiKey) {
            return res.status(500).json({ error: "Firebase API key not configured" });
        }

        // Sign in with Firebase Authentication
        const authResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    returnSecureToken: true
                })
            }
        );

        const authData = await authResponse.json();

        if (!authResponse.ok) {
            return res.status(401).json({ error: authData.error?.message || "Invalid email or password" });
        }

        res.status(200).json({
            success: true,
            idToken: authData.idToken,
            userId: authData.localId,
            message: "Login successful"
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Internal server error during login" });
    }
            }
