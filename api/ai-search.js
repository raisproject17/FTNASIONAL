export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "API Key belum diatur." });

        const { query } = req.body;
        
        // Menggunakan model flash-8b (Flash Lite) yang sangat efisien
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent`;

        const payload = {
            contents: [{ 
                parts: [{ text: `Berikan jawaban ringkas dan akurat untuk pertanyaan berikut: "${query}"` }] 
            }],
            systemInstruction: { 
                parts: [{ text: "Anda adalah asisten cerdas. Jawab dengan singkat, padat, dan akurat." }] 
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey 
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error?.message || 'Gagal memanggil AI.');

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        res.status(200).json({ answer: text || "Jawaban tidak ditemukan." });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
