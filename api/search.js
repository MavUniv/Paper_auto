export default async function handler(req, res) {
    // 오직 GET 요청만 허용
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: '검색어(query) 파라미터가 필요합니다.' });
    }

    // Vercel 환경 변수에서 키를 읽어옴
    const serpKey = process.env.SERP_API_KEY;
    if (!serpKey) {
        return res.status(500).json({ error: '서버에 API 키가 설정되지 않았습니다 (Vercel 환경변수 누락).' });
    }

    try {
        // SerpApi 호출
        const targetUrl = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(query)}&api_key=${serpKey}`;
        
        const response = await fetch(targetUrl);
        if (!response.ok) {
            throw new Error(`SerpApi responded with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // 클라이언트(프론트엔드)로 데이터 전달
        return res.status(200).json(data);
    } catch (error) {
        console.error('Search API Error:', error);
        return res.status(500).json({ error: '데이터를 가져오는 중 서버 오류가 발생했습니다.' });
    }
}
