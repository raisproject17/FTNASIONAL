export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    // API Key tersembunyi di dalam Vercel
    const API_KEY = process.env.GEMINI_API_KEY;
    const query = req.body.query;

    if (!query) return res.status(400).json({ error: "Query kosong" });

    // Menggunakan model stabil (gemini-1.5-flash)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    const payload = {
        contents: [{ parts: [{ text: query }] }],
        systemInstruction: { 
            parts: [{ text: "Anda adalah asisten cerdas untuk menjawab kuis dan pertanyaan umum. Berikan jawaban yang akurat, singkat, dan langsung pada intinya dalam bahasa Indonesia." }] 
        },
        // PERBAIKAN: Format tool Google Search yang didukung oleh API REST Google
        tools: [{ googleSearch: {} }] 
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "AI Request Failed");
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI tidak menemukan jawaban.";
        
        const rawSources = data.candidates?.[0]?.groundingMetadata?.groundingAttributions;
        let sources = [];
        if (rawSources) {
            sources = rawSources
                .filter(a => a.web && a.web.uri)
                .map(a => ({ uri: a.web.uri, title: a.web.title }));
            // Hilangkan duplikat
            sources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);
        }

        res.status(200).json({ text, sources });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
