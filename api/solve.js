export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { question, subject } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-exp:free",
                messages: [
                    { 
                        role: "system", 
                        content: `You are an expert tutor specialized in ${subject || 'Biology, Chemistry, Mathematics and Physics'}. Give clear step-by-step explanations.` 
                    },
                    { role: "user", content: question }
                ],
                temperature: 0.7,
                max_tokens: 1200
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenRouter Error:", data);
            return res.status(500).json({ error: data.error?.message || "OpenRouter API error" });
        }

        res.status(200).json({
            success: true,
            answer: data.choices?.[0]?.message?.content || "No response from AI."
        });

    } catch (error) {
        console.error("Proxy Error:", error);
        res.status(500).json({ error: "Failed to connect to AI service" });
    }
}
