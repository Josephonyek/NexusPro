import crypto from 'crypto';

const ipRateLimiter = {};
const LIMIT_WINDOW_MS = 60 * 1000; 
const MAX_SIGNUPS_PER_WINDOW = 100; 

function computeSHA256(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'global';
    const currentTime = Date.now();
    
    if (!ipRateLimiter[clientIp]) {
        ipRateLimiter[clientIp] = { count: 1, resetTime: currentTime + LIMIT_WINDOW_MS };
    } else {
        if (currentTime > ipRateLimiter[clientIp].resetTime) {
            ipRateLimiter[clientIp] = { count: 1, resetTime: currentTime + LIMIT_WINDOW_MS };
        } else {
            ipRateLimiter[clientIp].count += 1;
            if (ipRateLimiter[clientIp].count > MAX_SIGNUPS_PER_WINDOW) {
                return res.status(429).json({ error: "Too many registration attempts. Please wait a minute." });
            }
        }
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        // Fallback directly to your string URL if the environment variable fails to read
        const databaseUrl = process.env.FIREBASE_DATABASE_URL || 'https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app';
        const serverAuthKey = process.env.FIREBASE_SERVER_KEY;

        // Clean trailing slash if it exists dynamically
        const cleanDbUrl = databaseUrl.replace(/\/$/, "");

        // 1. Fetch check
        const checkUrl = `${cleanDbUrl}/users.json${serverAuthKey ? `?auth=${serverAuthKey}` : ''}`;
        const checkResponse = await fetch(checkUrl);
        
        if (!checkResponse.ok) {
            const errText = await checkResponse.text();
            console.error("Firebase Read Error Status:", checkResponse.status, errText);
            return res.status(500).json({ error: `Database Read Error: ${checkResponse.status}` });
        }

        const existingUsers = await checkResponse.json();

        if (existingUsers) {
            for (const id in existingUsers) {
                if (existingUsers[id].email?.toLowerCase() === email.trim().toLowerCase()) {
                    return res.status(400).json({ error: 'An account with this email already exists.' });
                }
            }
        }

        // 2. Hash and prepare node
        const securePasswordHash = computeSHA256(password);
        const generatedUid = 'user_' + crypto.randomBytes(8).toString('hex');

        const newProfileNode = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: securePasswordHash,
            role: 'student',
            status: 'active'
        };

        // 3. Write attempt using explicit user path
        const writeUrl = `${cleanDbUrl}/users/${generatedUid}.json${serverAuthKey ? `?auth=${serverAuthKey}` : ''}`;
        const writeResponse = await fetch(writeUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProfileNode)
        });

        if (!writeResponse.ok) {
            const errorDetails = await writeResponse.text();
            console.error("Firebase Write Error Details:", errorDetails);
            return res.status(500).json({ error: `Firebase write rejected: ${writeResponse.statusText}` });
        }

        const initialSessionToken = crypto.randomBytes(32).toString('hex');

        return res.status(200).json({
            message: "Registration completed successfully.",
            token: initialSessionToken,
            userId: generatedUid
        });

    } catch (serverError) {
        console.error("Caught Serverless Error:", serverError);
        return res.status(500).json({ error: `Server Exception: ${serverError.message}` });
    }
    }
