// api/signup.js - Backend Node Endpoint Handler
import { adminAuth, adminDb } from "./firebaseAdmin.js";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    const { fullName, email, hashedPassword } = req.body;

    try {
        // 1. Forge account record inside identity console via service account authority
        const userRecord = await adminAuth.createUser({
            email: email,
            password: hashedPassword, // Uses client-side SHA-256 parameter as key string
            displayName: fullName
        });

        // 2. Provision initial user node inside Realtime Database matching rules
        const dbRef = adminDb.ref(`users/${userRecord.uid}`);
        await dbRef.set({
            name: fullName,
            role: "student",
            status: "active",
            gameMetrics: { totalXP: 0, currentLevel: 1 }
        });

        // 3. Generate custom authorization token to bypass rule gates natively
        const token = await adminAuth.createCustomToken(userRecord.uid);

        return res.status(200).json({ 
            success: true, 
            token: token, 
            userId: userRecord.uid,
            role: "student"
        });

    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}
