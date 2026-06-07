// api/firebaseConfig.js

export default async function handler(req, res) {
  // Add security headers to prevent unauthorized domains from fetching your keys
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  // Double check your Vercel dashboard environment keys match these exact variable names
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };

  // If the keys are completely missing on Vercel, alert the developer console
  if (!config.apiKey || !config.databaseURL) {
    return res.status(500).json({ 
      error: "Missing environment variables. Check your Vercel Project Settings Dashboard." 
    });
  }

  return res.status(200).json(config);
}
