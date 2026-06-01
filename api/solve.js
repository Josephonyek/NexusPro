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
        return res.status(500).json({ error: "GROQ_API_KEY is missing" });
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",   // Smaller but very stable model
                messages: [
                    { 
                        role: "system", 
                        content: `You are an expert tutor in Biology, Chemistry, Mathematics and Physics. Explain step by step.` 
                    },
                    { role: "user", content: question }
                ],
                temperature: 0.7,
                max_tokens: 1200
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            return res.status(500).json({ error: `Groq Error: ${response.status} - ${errorData}` });
        }

        const data = await response.json();

        res.status(200).json({
            success: true,
            answer: data.choices?.[0]?.message?.content || "No response received."
        });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ 
            error: "Failed to connect to Groq. Check your API key and internet connection." 
        });
    }
}
