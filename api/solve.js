export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { question, subject } = req.body || {};

    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ 
            error: "Missing Groq API Key on server",
            message: "GROQ_API_KEY environment variable is not set"
        });
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: `You are an expert STEM tutor in ${subject || 'Biology, Chemistry, Mathematics, and Physics'}. Give clear step-by-step explanations.` 
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
                error: data.error?.message || "Groq API Error",
                status: response.status
            });
        }

        res.status(200).json({
            success: true,
            answer: data.choices?.[0]?.message?.content || "No response received."
        });

    } catch (error) {
        console.error("Groq Connection Error:", error);
        res.status(500).json({ 
            error: "Failed to connect to Groq",
            details: error.message 
        });
    }
                }
