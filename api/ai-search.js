export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: "API Key Gemini belum diatur di Vercel Settings." });
        }

        const { query } = req.body;
        
        // Menggunakan endpoint v1beta dengan model gemini-1.5-flash
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

        const payload = {
            contents: [{ 
                parts: [{ text: `Carikan jawaban yang paling tepat, jelas, dan komprehensif untuk pertanyaan kuis/ujian ini: "${query}"` }] 
            }],
            systemInstruction: { 
                parts: [{ text: "Anda adalah asisten cerdas pemecah soal. Berikan jawaban yang terstruktur, rapi, dan langsung pada intinya." }] 
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey // Menggunakan header standar terbaru untuk kunci AQ.
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("Gemini API Error Detail:", data);
            throw new Error(data.error?.message || 'Gagal tersambung dengan server AI Google.');
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        res.status(200).json({ answer: text || "Maaf, jawaban tidak dapat diproses oleh AI." });

    } catch (error) {
        console.error("AI Search Error:", error);
        res.status(500).json({ error: error.message });
    }
}
