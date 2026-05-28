export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { question, subject } = req.body || {};

    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    // === DEBUG INFO ===
    if (!apiKey) {
        return res.status(500).json({ 
            error: "Missing API Key on Vercel",
            message: "Environment variable OPENROUTER_API_KEY is not set or empty"
        });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://nexus-pro-iota.vercel.app",
                "X-Title": "Nexus Pro"
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-chat",
                messages: [
                    { 
                        role: "system", 
                        content: `You are an expert STEM tutor in ${subject || 'Biology, Chemistry, Mathematics, and Physics'}. Give step-by-step explanations.` 
                    },
                    { role: "user", content: question }
                ],
                temperature: 0.7,
                max_tokens: 1200
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ 
                error: data.error?.message || "OpenRouter returned error",
                status: response.status
            });
        }

        res.status(200).json({
            success: true,
            answer: data.choices?.[0]?.message?.content || "No response"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
                    }
