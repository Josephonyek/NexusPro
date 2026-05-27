export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    // Debug response
    if (!apiKey) {
        return res.status(500).json({ 
            error: "Missing API Key on server",
            message: "process.env.OPENROUTER_API_KEY is empty"
        });
    }

    const { question, subject } = req.body;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-exp:free",
                messages: [
                    { role: "system", content: `You are a helpful STEM tutor.` },
                    { role: "user", content: question }
                ]
            })
        });

        const data = await response.json();

        res.status(200).json({
            success: true,
            answer: data.choices?.[0]?.message?.content || "No response",
            debug: "API Key was found"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
