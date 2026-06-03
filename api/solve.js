export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { question, subject, userId, userName } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "GROQ_API_KEY is missing" });
    }

    try {
        // Call Groq API
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
                        content: `You are an expert STEM tutor in ${subject || 'Biology, Chemistry, Mathematics, and Physics'}.` 
                    },
                    { role: "user", content: question }
                ],
                temperature: 0.7,
                max_tokens: 1400
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ error: data.error?.message || "Groq Error" });
        }

        const answer = data.choices?.[0]?.message?.content || "No response";

        // === LOG USAGE TO FIREBASE ===
        if (userId) {
            const logUrl = `https://nexuspro-cf948-default-rtdb.europe-west1.firebasedatabase.app/ai-usage/${userId}.json`;
            
            await fetch(logUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: question,
                    subject: subject || "General",
                    answer: answer.substring(0, 300), // Save first 300 chars
                    timestamp: Date.now(),
                    userName: userName || "Unknown"
                })
            });
        }

        res.status(200).json({
            success: true,
            answer: answer
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to connect to Groq" });
    }
                                     }
