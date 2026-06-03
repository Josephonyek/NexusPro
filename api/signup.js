export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }

    try {
        const firebaseApiKey = process.env.FIREBASE_API_KEY;   // ← Corrected

        if (!firebaseApiKey) {
            return res.status(500).json({ error: "Firebase API key not configured" });
        }

        // Create user with Firebase Authentication
        const authResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`,
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
            return res.status(400).json({ error: authData.error?.message || "Signup failed" });
        }

        const userId = authData.localId;
        const idToken = authData.idToken;

        // Save user profile to Realtime Database
        const dbUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/users/${userId}.json?auth=${idToken}`;

        await fetch(dbUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                email: email,
                role: "student",
                createdAt: Date.now()
            })
        });

        res.status(200).json({
            success: true,
            idToken: idToken,
            userId: userId,
            message: "Account created successfully"
        });

    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ error: "Internal server error during signup" });
    }
}
