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
        
        // Menggunakan model stabil terkini (Gemini 3.5 Flash-Lite / Flash) yang optimal sebagai mesin pencari/penjawab
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash-lite:generateContent`;

        const payload = {
            contents: [{ 
                role: 'user',
                parts: [{ text: `Bertindaklah sebagai search engine akademik dan umum yang sangat akurat. Berikan jawaban yang komprehensif, terstruktur, langsung pada intinya, serta akurat untuk pertanyaan berikut: "${query}"` }] 
            }],
            systemInstruction: { 
                parts: [{ text: "Anda adalah mesin pencari (search engine) instan berbasis AI. Berikan jawaban ringkas namun padat informasi dan bebas dari teks basa-basi pengantar." }] 
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
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Gagal tersambung dengan server AI Google.');
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        res.status(200).json({ answer: text || "Maaf, jawaban tidak dapat ditemukan." });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
