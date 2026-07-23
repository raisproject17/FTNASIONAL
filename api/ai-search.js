export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query tidak boleh kosong.' });
        }

        let answerText = null;
        let lastError = null;

        // --- 1. PROVIDER: GEMINI (Utama) ---
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey && !answerText) {
            try {
                const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-goog-api-key': geminiKey // Mendukung format kunci AQ. maupun AIza...
                    },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `Berikan jawaban yang paling tepat, ringkas, dan jelas untuk pertanyaan kuis/ujian berikut: "${query}"` }] }]
                    })
                });
                const data = await geminiRes.json();
                if (geminiRes.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    answerText = data.candidates[0].content.parts[0].text;
                } else {
                    lastError = "Gemini: " + (data.error?.message || "Gagal/Limit");
                }
            } catch (e) {
                lastError = "Gemini Error: " + e.message;
            }
        }

        // --- 2. PROVIDER: DEEPSEEK (Fallback 1) ---
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        if (deepseekKey && !answerText) {
            try {
                const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${deepseekKey}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-chat",
                        messages: [
                            { role: "system", content: "Anda adalah asisten cerdas pencari jawaban kuis yang akurat dan ringkas." },
                            { role: "user", content: query }
                        ],
                        stream: false
                    })
                });
                const data = await dsRes.json();
                if (dsRes.ok && data.choices?.[0]?.message?.content) {
                    answerText = data.choices[0].message.content;
                } else {
                    lastError = "DeepSeek: " + (data.error?.message || "Gagal/Limit");
                }
            } catch (e) {
                lastError = "DeepSeek Error: " + e.message;
            }
        }

        // --- 3. PROVIDER: TAVILY (Fallback 2) ---
        const tavilyKey = process.env.TAVILY_API_KEY;
        if (tavilyKey && !answerText) {
            try {
                const tavilyRes = await fetch('https://api.tavily.com/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: tavilyKey,
                        query: query,
                        include_answer: true,
                        search_depth: "basic"
                    })
                });
                const data = await tavilyRes.json();
                if (tavilyRes.ok && data.answer) {
                    answerText = data.answer;
                } else if (tavilyRes.ok && data.results?.length > 0) {
                    answerText = data.results[0].content;
                } else {
                    lastError = "Tavily: Gagal/Limit";
                }
            } catch (e) {
                lastError = "Tavily Error: " + e.message;
            }
        }

        // --- 4. PROVIDER: FIRECRAWL (Fallback 3) ---
        const firecrawlKey = process.env.FIRECRAWL_API_KEY;
        if (firecrawlKey && !answerText) {
            try {
                const fcRes = await fetch('https://api.firecrawl.dev/v1/search', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${firecrawlKey}`
                    },
                    body: JSON.stringify({
                        query: query,
                        limit: 1
                    })
                });
                const data = await fcRes.json();
                if (fcRes.ok && data.data?.[0]) {
                    // Mengambil deskripsi atau teks markdown hasil scrape firecrawl
                    answerText = data.data[0].description || data.data[0].markdown || data.data[0].content || "Ditemukan referensi di internet, namun teks tidak tersedia.";
                } else {
                    lastError = "Firecrawl: " + (data.error || "Gagal/Limit");
                }
            } catch (e) {
                lastError = "Firecrawl Error: " + e.message;
            }
        }

        // --- 5. PROVIDER: LANGSEARCH (Fallback 4) ---
        const langsearchKey = process.env.LANGSEARCH_API_KEY;
        if (langsearchKey && !answerText) {
            try {
                const lsRes = await fetch('https://api.langsearch.com/v1/search', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${langsearchKey}`
                    },
                    body: JSON.stringify({ query: query })
                });
                const data = await lsRes.json();
                if (lsRes.ok && (data.answer || data.result || data.text)) {
                    answerText = data.answer || data.result || data.text;
                } else {
                    lastError = "Langsearch: Gagal/Limit";
                }
            } catch (e) {
                lastError = "Langsearch Error: " + e.message;
            }
        }

        // --- FINAL CEK ---
        if (!answerText) {
            return res.status(500).json({ 
                error: `Semua API Engine gagal, belum diatur, atau limit harian habis. (Status Terakhir: ${lastError || 'Tidak ada API Key yang dikonfigurasi'})` 
            });
        }

        res.status(200).json({ answer: answerText });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
