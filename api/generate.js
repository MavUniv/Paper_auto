export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: '서버에 OPENAI_API_KEY가 설정되지 않았습니다.' });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || 'OpenAI API 호출에 실패했습니다.');
        }

        const data = await response.json();
        const text = data.choices[0].message.content;

        return res.status(200).json({ text });
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return res.status(500).json({ error: error.message || '텍스트 생성 중 오류가 발생했습니다.' });
    }
}
