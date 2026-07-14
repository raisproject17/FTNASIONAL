module.exports = async function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const query = req.body.query;
    if (!query) return res.status(400).json({ error: "Query pencarian tidak boleh kosong." });

    // 2. API KEY GEMINI ANDA
    const API_KEY = "AQ.Ab8RN6LsdtqNeGVnT8pKUZDQpfzJDbGeco3n_Hy_fEFaNzNo2Q";
    
    // Konfigurasi model stabil
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    const payload = {
        contents: [{ parts: [{ text: query }] }],
        systemInstruction: { 
            parts: [{ text: "Anda adalah asisten cerdas untuk menjawab kuis dan pertanyaan umum. Berikan jawaban yang akurat, singkat, dan langsung pada intinya dalam bahasa Indonesia." }] 
        },
        tools: [{ googleSearch: {} }] 
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || "Koneksi ke AI gagal. Periksa kembali API Key Anda.");
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, AI tidak menemukan jawaban.";
        
        // Memisahkan sumber referensi link dari Google
        const rawSources = data.candidates?.[0]?.groundingMetadata?.groundingAttributions;
        let sources = [];
        if (rawSources) {
            sources = rawSources
                .filter(a => a.web && a.web.uri)
                .map(a => ({ uri: a.web.uri, title: a.web.title }));
            sources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);
        }

        res.status(200).json({ text, sources });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
