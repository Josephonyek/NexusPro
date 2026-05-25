export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const firebaseApiKey = process.env.FIREBASE_API_KEY;
        const signupEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`;

        // 1. Create user account inside Firebase Authentication core
        const authResponse = await fetch(signupEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, returnSecureToken: true })
        });

        const authData = await authResponse.json();

        if (!authResponse.ok) {
            let errorMsg = "Registration failed.";
            if (authData.error && authData.error.message === "EMAIL_EXISTS") {
                errorMsg = "This email address is already in use.";
            }
            return res.status(authResponse.status).json({ error: errorMsg });
        }

        const userId = authData.localId;
        const userToken = authData.idToken;

        // 2. Automatically generate the Student document structure in Firestore Database
        // Targets: nexuspro-cf948 -> users collection -> userId document
        const firestoreEndpoint = `https://firestore.googleapis.com/v1/projects/nexuspro-cf948/databases/(default)/documents/users/${userId}?documentId=${userId}`;

        const profilePayload = {
            fields: {
                name: { stringValue: fullName },
                email: { stringValue: email },
                role: { stringValue: "student" },
                createdAt: { timestampValue: new Date().toISOString() }
            }
        };

        await fetch(firestoreEndpoint, {
            method: 'PATCH', // PATCH inserts or replaces fields cleanly
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}` // Authenticates data write safely
            },
            body: JSON.stringify(profilePayload)
        });

        // Send confirmation back to your phone frontend
        return res.status(200).json({
            success: true,
            userId: userId,
            token: userToken
        });

    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
