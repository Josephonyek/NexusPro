export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { question, subject } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "Missing API Key on server" });
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
                model: "deepseek/deepseek-chat",
                messages: [
                    { 
                        role: "system", 
                        content: `You are an expert STEM tutor specialized in ${subject || 'Biology, Chemistry, Mathematics, and Physics'}. 
                        Provide clear, detailed step-by-step solutions. Use LaTeX for equations.` 
                    },
                    { role: "user", content: question }
                ],
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ error: data.error?.message || "OpenRouter Error" });
        }

        res.status(200).json({
            success: true,
            answer: data.choices?.[0]?.message?.content || "No response received."
        });

    } catch (error) {
        console.error("Proxy Error:", error);
        res.status(500).json({ error: "Failed to connect to DeepSeek AI." });
    }
                        }
