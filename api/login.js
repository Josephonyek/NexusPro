import crypto from 'crypto';

// Global server-side memory tracker for brute-force tracking
// Note: In an enterprise system, this is ideally a Redis node, but this blocks standard attacks effectively
const loginAttemptsTracker = {}; 

const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 3 * 60 * 1000; // Exactly 3 Minutes

// Helper function to hash passwords cleanly on the secure server
function computeSHA256(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing required credential inputs.' });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // 1. Evaluate Brute-Force Lockouts on the Server
    const trackingRecord = loginAttemptsTracker[sanitizedEmail] || { count: 0, lockUntil: 0 };

    if (trackingRecord.lockUntil > Date.now()) {
        const timeLeftMs = trackingRecord.lockUntil - Date.now();
        const minutes = Math.floor(timeLeftMs / 60000);
        const seconds = Math.ceil((timeLeftMs % 60000) / 1000);
        return res.status(429).json({ 
            error: `🛑 Too many failed attempts. Account frozen. Please wait ${minutes}m ${seconds}s before retrying.` 
        });
    }

    try {
        // 2. Safely read Firebase parameters from environment variables
        const databaseUrl = process.env.FIREBASE_DATABASE_URL || 'https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app';
        const serverAuthKey = process.env.FIREBASE_SERVER_KEY; // Your protected environment secret key

        // Hash the input password to match your registration hashes
        const securePasswordHash = computeSHA256(password);

        // Fetch users from Firebase securely via server communications
        const targetUrl = `${databaseUrl}/users.json${serverAuthKey ? `?auth=${serverAuthKey}` : ''}`;
        const dbResponse = await fetch(targetUrl);
        const usersData = await dbResponse.json();

        let targetUser = null;
        let targetUid = null;

        if (usersData) {
            for (const uid in usersData) {
                if (usersData[uid].email?.toLowerCase() === sanitizedEmail && usersData[uid].password === securePasswordHash) {
                    targetUser = usersData[uid];
                    targetUid = uid;
                    break;
                }
            }
        }

        // 3. Evaluate Authentication Context Result
        if (targetUser) {
            // Success: clear tracking record entirely
            delete loginAttemptsTracker[sanitizedEmail];

            if (targetUser.status === 'banned') {
                return res.status(403).json({ error: 'This workspace profile node has been restricted.' });
            }

            // Generate a secure, hard-to-forge mock session state string token
            const sessionToken = crypto.randomBytes(32).toString('hex');

            return res.status(200).json({
                message: 'Clearance approved.',
                token: sessionToken,
                userId: targetUid
            });

        } else {
            // Failure: Increment counters on the backend memory stack
            trackingRecord.count += 1;
            
            if (trackingRecord.count >= MAX_ATTEMPTS) {
                trackingRecord.lockUntil = Date.now() + LOCK_TIME_MS;
                loginAttemptsTracker[sanitizedEmail] = trackingRecord;
                return res.status(429).json({ 
                    error: `🛑 Too many failed attempts. Five limits crossed. Locked out for 3 minutes.` 
                });
            } else {
                loginAttemptsTracker[sanitizedEmail] = trackingRecord;
                return res.status(401).json({ 
                    error: `❌ Invalid credentials. (Attempt ${trackingRecord.count} of ${MAX_ATTEMPTS})` 
                });
            }
        }

    } catch (serverError) {
        console.error("Critical API Authentication Loop Error:", serverError);
        return res.status(500).json({ error: 'Internal secure server gateway failure.' });
    }
}
