import crypto from 'crypto';

// Server-side memory tracking for IP-based signup rate limiting
const ipRateLimiter = {};
const LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 Minutes
const MAX_SIGNUPS_PER_WINDOW = 3;       // Max 3 registrations per IP every 15 minutes

function computeSHA256(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 1. IP-Based Rate Limiting to Stop Server Spam/Overload
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'global';
    const currentTime = Date.now();
    
    if (!ipRateLimiter[clientIp]) {
        ipRateLimiter[clientIp] = { count: 1, resetTime: currentTime + LIMIT_WINDOW_MS };
    } else {
        if (currentTime > ipRateLimiter[clientIp].resetTime) {
            // Window expired, reset counter tracker cleanly
            ipRateLimiter[clientIp] = { count: 1, resetTime: currentTime + LIMIT_WINDOW_MS };
        } else {
            ipRateLimiter[clientIp].count += 1;
            if (ipRateLimiter[clientIp].count > MAX_SIGNUPS_PER_WINDOW) {
                return res.status(429).json({ 
                    error: "🛑 Security Warning: Too many accounts created from this network. Please try again in 15 minutes." 
                });
            }
        }
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are strictly required.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    try {
        const databaseUrl = process.env.FIREBASE_DATABASE_URL || 'https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app';
        const serverAuthKey = process.env.FIREBASE_SERVER_KEY;

        const targetUrl = `${databaseUrl}/users.json${serverAuthKey ? `?auth=${serverAuthKey}` : ''}`;
        
        // 2. Fetch users to verify if the email address is already taken
        const checkResponse = await fetch(targetUrl);
        const existingUsers = await checkResponse.json();

        if (existingUsers) {
            for (const id in existingUsers) {
                if (existingUsers[id].email?.toLowerCase() === email.trim().toLowerCase()) {
                    return res.status(400).json({ error: '❌ An account with this email address already exists.' });
                }
            }
        }

        // 3. SECURE THE PASSWORD: Convert raw text string into a clean SHA-256 hash output
        const securePasswordHash = computeSHA256(password);

        const newProfileNode = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: securePasswordHash, // The raw text string never enters your database!
            role: 'student',               // New users default cleanly to student permissions
            status: 'active'
        };

        // 4. Post the secure object schema directly to your Firebase configuration
        const writeResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProfileNode)
        });

        const writeData = await writeResponse.json();
        
        // Mock a token exchange string matching your architecture flow
        const initialSessionToken = crypto.randomBytes(32).toString('hex');

        return res.status(200).json({
            message: "Registration completed successfully.",
            token: initialSessionToken,
            userId: writeData.name // Firebase POST return references the unique node id as "name"
        });

    } catch (serverError) {
        console.error("Critical Registry Execution Defect:", serverError);
        return res.status(500).json({ error: 'Internal secure server registration failure.' });
    }
                    }
