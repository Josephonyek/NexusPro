import crypto from 'crypto';

// Server-side memory tracking for a relaxed, secure rate limit
const ipRateLimiter = {};
const LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_SIGNUPS_PER_WINDOW = 100; // Allowed up to 100 signups per minute

function computeSHA256(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 1. Relaxed Rate Limiting: 100 requests per minute
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
                return res.status(429).json({ 
                    error: "Too many registration attempts from this network. Please wait a minute." 
                });
            }
        }
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const databaseUrl = process.env.FIREBASE_DATABASE_URL || 'https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app';
        const serverAuthKey = process.env.FIREBASE_SERVER_KEY;

        // 2. Check if user email already exists in the database
        const checkUrl = `${databaseUrl}/users.json${serverAuthKey ? `?auth=${serverAuthKey}` : ''}`;
        const checkResponse = await fetch(checkUrl);
        const existingUsers = await checkResponse.json();

        if (existingUsers) {
            for (const id in existingUsers) {
                if (existingUsers[id].email?.toLowerCase() === email.trim().toLowerCase()) {
                    return res.status(400).json({ error: 'An account with this email already exists.' });
                }
            }
        }

        // 3. Hash the raw password using SHA-256
        const securePasswordHash = computeSHA256(password);

        // 4. Generate a clean, unique User ID on the backend server
        const generatedUid = 'user_' + crypto.randomBytes(8).toString('hex');

        const newProfileNode = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: securePasswordHash, // The database saves only the secure hash string
            role: 'student',
            status: 'active'
        };

        // 5. Save explicitly using a PUT request to the generated user ID path
        const writeUrl = `${databaseUrl}/users/${generatedUid}.json${serverAuthKey ? `?auth=${serverAuthKey}` : ''}`;
        const writeResponse = await fetch(writeUrl, {
            method: 'PUT', // PUT writes directly to this specific path node
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProfileNode)
        });

        if (!writeResponse.ok) {
            throw new Error("Failed to write data to Firebase database storage.");
        }

        // Mock a clean authorization token session string for the dashboard process
        const initialSessionToken = crypto.randomBytes(32).toString('hex');

        return res.status(200).json({
            message: "Registration completed successfully.",
            token: initialSessionToken,
            userId: generatedUid
        });

    } catch (serverError) {
        console.error("Critical Registry Execution Error:", serverError);
        return res.status(500).json({ error: 'Internal secure server registration failure.' });
    }
        }
