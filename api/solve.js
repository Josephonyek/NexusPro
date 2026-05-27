export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { question, subject } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }

    // Check if API key is loaded from Vercel Environment Variables
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ 
            error: "Missing API Key on server",
            message: "Please check Vercel Environment Variables"
        });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://nexus-pro-iota.vercel.app",
                "X-Title": "Nexus Pro AI Solver"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-exp:free",
                messages: [
                    { 
                        role: "system", 
                        content: `You are an expert STEM tutor specialized in ${subject || 'Biology, Chemistry, Mathematics, and Physics'}. 
                        Always explain concepts clearly with step-by-step reasoning. Use LaTeX for equations when needed.` 
                    },
                    { role: "user", content: question }
                ],
                temperature: 0.7,
                max_tokens: 1400
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ 
                error: data.error?.message || "OpenRouter API Error" 
            });
        }

        res.status(200).json({
            success: true,
            answer: data.choices?.[0]?.message?.content || "No response received."
        });

    } catch (error) {
        console.error("AI Proxy Error:", error);
        res.status(500).json({ 
            error: "Failed to connect to AI service. Please try again." 
        });
    }
}
