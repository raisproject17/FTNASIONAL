export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Ambil kunci API Tavily dari Vercel Environment Variable (TAVILY_API_KEY)
        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "TAVILY_API_KEY belum diatur di Vercel Settings." });
        }

        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query tidak boleh kosong.' });
        }

        // Endpoint resmi Tavily Search API untuk mendapatkan hasil riset web instan siap pakai
        const url = 'https://api.tavily.com/search';

        const payload = {
            api_key: apiKey,
            query: `Carikan jawaban yang akurat, terstruktur, dan langsung pada intinya untuk pertanyaan kuis/ujian ini: "${query}"`,
            search_depth: "advanced",
            include_answer: true,
            max_results: 3
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Gagal memproses pencarian dengan Tavily API.');
        }

        // Tavily mengembalikan ringkasan jawaban terbaik di field 'answer'
        const answerText = data.answer || (data.results && data.results[0]?.content) || "Jawaban tidak ditemukan dari pencarian web.";
        
        res.status(200).json({ answer: answerText });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
