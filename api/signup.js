// api/signup.js - Fixed CommonJS Version
const { adminAuth, adminDb } = require("./firebaseAdmin.js");

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { fullName, email, hashedPassword } = req.body;

    try {
        // Create user record inside Firebase Auth Authentication Console via admin privileges
        const userRecord = await adminAuth.createUser({
            email: email,
            password: hashedPassword,
            displayName: fullName
        });

        // Initialize user data record block securely matching your validation rules structure
        const dbRef = adminDb.ref(`users/${userRecord.uid}`);
        await dbRef.set({
            name: fullName,
            role: "student",
            status: "active",
            gameMetrics: { totalXP: 0, currentLevel: 1 }
        });

        // Generate matching dynamic access custom verification token
        const customToken = await adminAuth.createCustomToken(userRecord.uid);

        return res.status(200).json({ 
            success: true, 
            token: customToken, 
            userId: userRecord.uid,
            role: "student"
        });

    } catch (error) {
        console.error("Signup Route Failure:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};
