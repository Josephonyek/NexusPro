export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { question, subject } = req.body || {};

    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;   // ← Changed to DEEPSEEK_API_KEY

    if (!apiKey) {
        return res.status(500).json({ 
            error: "Missing DeepSeek API Key on server",
            message: "Please add DEEPSEEK_API_KEY in Vercel Environment Variables"
        });
    }

    try {
        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "deepseek-chat",          // Good general model
                messages: [
                    { 
                        role: "system", 
                        content: `You are an expert STEM tutor specialized in ${subject || 'Biology, Chemistry, Mathematics, and Physics'}. 
                        Explain concepts clearly with step-by-step reasoning. Use LaTeX for math equations.` 
                    },
                    { role: "user", content: question }
                ],
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ 
                error: data.error?.message || "DeepSeek API Error" 
            });
        }

        res.status(200).json({
            success: true,
            answer: data.choices?.[0]?.message?.content || "No response received."
        });

    } catch (error) {
        console.error("DeepSeek Proxy Error:", error);
        res.status(500).json({ error: "Failed to connect to DeepSeek AI. Please try again." });
    }
}
