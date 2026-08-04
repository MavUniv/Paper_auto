// App State
const state = {
    theme: localStorage.getItem('theme') || 'light',
    write: {
        step: 1,
        topic: '',
        selectedTitle: '',
        outline: '',
        draft: '',
        conclusion: ''
    }
};

// DOM Elements
const body = document.body;
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const mainContent = document.getElementById('main-content');

// Initialize
function init() {
    applyTheme();
    setupEventListeners();
    handleRoute();
    lucide.createIcons();
}

function applyTheme() {
    if (state.theme === 'dark') {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themeToggleBtn.innerHTML = '<i data-lucide="sun"></i><span>라이트 모드</span>';
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themeToggleBtn.innerHTML = '<i data-lucide="moon"></i><span>다크 모드</span>';
    }
    lucide.createIcons();
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    applyTheme();
}



function setupEventListeners() {
    // Sidebar
    mobileMenuBtn.addEventListener('click', () => sidebar.classList.add('open'));
    closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));
    
    // Theme
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Routing
    window.addEventListener('hashchange', handleRoute);
}

// Router & Pages
const pages = {
    '/': {
        title: '논문 검색 (키워드)',
        desc: 'Google Scholar 기반 논문 검색을 지원합니다.',
        render: () => `
            <div class="search-box">
                <input type="text" id="keyword-search" class="search-input" placeholder="관심있는 연구 주제나 키워드를 입력하세요...">
                <button class="primary-btn" onclick="mockSearch('keyword')"><i data-lucide="search"></i> 검색</button>
            </div>
            <div id="search-results">
                <!-- Results will appear here -->
                <p style="color: var(--text-muted); text-align: center; margin-top: 3rem;">검색어를 입력하고 버튼을 눌러보세요.</p>
            </div>
        `
    },
    '/semantic': {
        title: '논문 검색 (맥락)',
        desc: 'AI가 문장의 의미를 분석하여 가장 적합한 논문을 추천해 드립니다.',
        render: () => `
            <div class="search-box">
                <input type="text" id="semantic-search" class="search-input" placeholder="질문 형태나 긴 문장으로 논문을 찾아보세요...">
                <button class="primary-btn" onclick="mockSearch('semantic')"><i data-lucide="sparkles"></i> AI 검색</button>
            </div>
            <div id="search-results"></div>
        `
    },
    '/write': {
        title: '학술지 작성 (AI 단계별)',
        desc: 'AI와 함께 단계별로 논문 작성을 진행합니다.',
        render: () => {
            // 초기 렌더링 시 빈 컨테이너를 반환하고, setTimeout으로 즉시 상태에 맞는 화면을 그립니다.
            setTimeout(() => renderWriteStep(), 0);
            return `<div id="write-container"></div>`;
        }
    },
    '/citation': {
        title: 'Citation Maker',
        desc: '논문 정보를 입력하면 올바른 인용 포맷(APA, MLA 등)으로 변환해 줍니다.',
        render: () => `
            <div class="result-card">
                <p>Citation 생성 폼이 들어갈 자리입니다. (추후 구현)</p>
            </div>
        `
    }
};

function handleRoute() {
    let path = window.location.hash.replace('#', '') || '/';
    
    // Default fallback
    if (!pages[path]) {
        path = '/';
    }
    
    const page = pages[path];
    
    // Update active nav state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + path) {
            link.classList.add('active');
        }
    });
    
    // Close sidebar on mobile after navigation
    sidebar.classList.remove('open');
    
    // Render Page
    mainContent.innerHTML = `
        <div class="page-enter">
            <div class="page-header">
                <h1 class="page-title">${page.title}</h1>
                <p class="page-desc">${page.desc}</p>
            </div>
            ${page.render()}
        </div>
    `;
    
    lucide.createIcons();
}

// Real API Search Function
window.mockSearch = async function(type) {
    const resultsContainer = document.getElementById('search-results');
    
    let query = '';
    if (type === 'keyword') {
        query = document.getElementById('keyword-search').value;
    } else if (type === 'semantic') {
        query = document.getElementById('semantic-search').value;
    }

    if (!query.trim()) {
        alert('검색어를 입력해주세요.');
        return;
    }

    // Show Loading
    resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i data-lucide="loader-2" class="lucide-spin" style="width: 2rem; height: 2rem; color: var(--primary); animation: spin 1s linear infinite;"></i>
            <p style="margin-top: 1rem; color: var(--text-muted);">Vercel 서버를 통해 안전하게 데이터를 가져오는 중입니다...</p>
        </div>
    `;
    lucide.createIcons();

    if (!document.getElementById('spin-anim')) {
        const style = document.createElement('style');
        style.id = 'spin-anim';
        style.innerHTML = '@keyframes spin { 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }

    try {
        // 백엔드(서버리스 함수) 호출
        const targetUrl = `/api/search?query=${encodeURIComponent(query)}`;
        const response = await fetch(targetUrl);
        
        if (!response.ok) {
            throw new Error(`서버 에러: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
             throw new Error(data.error);
        }

        const organicResults = data.organic_results || [];

        if (organicResults.length === 0) {
            resultsContainer.innerHTML = `<p style="text-align:center; margin-top:2rem; color:var(--text-muted);">검색 결과가 없습니다.</p>`;
            return;
        }

        let html = '';
        if (type === 'semantic') {
            html += `
                <div class="result-card" style="border-left: 4px solid var(--primary); background: var(--menu-blue);">
                    <h3 class="result-title" style="display:flex; align-items:center; gap:0.5rem;"><i data-lucide="sparkles"></i> AI 검색 결과</h3>
                    <p>맥락에 맞는 검색 결과를 구글 스칼라에서 가져왔습니다. (초록 요약 등 AI 추가 분석은 OpenAI 연동 시 작동합니다.)</p>
                </div>
            `;
        }

        organicResults.forEach(res => {
            const authors = res.publication_info?.summary || '저자 정보 없음';
            const link = res.link || '#';
            const snippet = res.snippet || '초록 정보가 없습니다.';
            
            html += `
                <div class="result-card">
                    <h3 class="result-title">${res.title}</h3>
                    <p class="result-meta">${authors}</p>
                    <p style="font-size: 0.875rem; line-height: 1.5; color: var(--text-main); margin-bottom: 1rem;">
                        ${snippet}
                    </p>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="icon-text-btn" style="width: auto; padding: 0.25rem 0.5rem; background: var(--border-color);"><i data-lucide="bookmark"></i> 저장</button>
                        <a href="${link}" target="_blank" style="text-decoration: none;">
                            <button class="icon-text-btn" style="width: auto; padding: 0.25rem 0.5rem; background: var(--border-color); color: var(--text-main);"><i data-lucide="external-link"></i> 원문 보기</button>
                        </a>
                    </div>
                </div>
            `;
        });

        resultsContainer.innerHTML = html;
        lucide.createIcons();

    } catch (error) {
        console.error(error);
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #ef4444;">
                <p>데이터를 가져오는 중 오류가 발생했습니다.</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">API 키가 유효한지 확인해주세요. 오류: ${error.message}</p>
            </div>
        `;
    }
}

function showMockData(type, resultsContainer) {
    resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i data-lucide="loader-2" class="lucide-spin" style="width: 2rem; height: 2rem; color: var(--primary); animation: spin 1s linear infinite;"></i>
            <p style="margin-top: 1rem; color: var(--text-muted);">논문 데이터를 가져오는 중입니다...</p>
        </div>
    `;
    lucide.createIcons();
    setTimeout(() => {
        const results = [
            { title: '인공지능을 활용한 자연어 처리 기술 동향', authors: '홍길동, 김철수', year: 2024, journal: '한국컴퓨터정보학회논문지' },
            { title: '대형 언어 모델(LLM)의 윤리적 문제와 해결 방안', authors: '이영희', year: 2023, journal: 'AI 윤리 연구' },
            { title: 'React와 웹 컴포넌트 성능 비교 연구', authors: '박지성', year: 2022, journal: '정보과학회논문지' }
        ];

        let html = '';
        if (type === 'semantic') {
            html += `
                <div class="result-card" style="border-left: 4px solid var(--primary); background: var(--menu-blue);">
                    <h3 class="result-title" style="display:flex; align-items:center; gap:0.5rem;"><i data-lucide="sparkles"></i> AI 요약 분석</h3>
                    <p>입력하신 맥락에 따르면, 최근 가장 주목받는 연구 분야는 대형 언어 모델과 자연어 처리 최적화에 관한 것입니다. 관련 논문 3편을 추천합니다.</p>
                </div>
            `;
        }

        results.forEach(res => {
            html += `
                <div class="result-card">
                    <h3 class="result-title">${res.title}</h3>
                    <p class="result-meta">${res.authors} · ${res.year} · ${res.journal}</p>
                    <p style="font-size: 0.875rem; line-height: 1.5; color: var(--text-main);">
                        이 논문은 AI 모델의 최신 동향과 실무 적용 사례를 분석하여 향후 연구 방향을 제시합니다.
                    </p>
                    <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                        <button class="icon-text-btn" style="width: auto; padding: 0.25rem 0.5rem; background: var(--border-color);"><i data-lucide="bookmark"></i> 저장</button>
                        <button class="icon-text-btn" style="width: auto; padding: 0.25rem 0.5rem; background: var(--border-color);"><i data-lucide="external-link"></i> 원문 보기</button>
                    </div>
                </div>
            `;
        });

        resultsContainer.innerHTML = html;
        lucide.createIcons();
    }, 1500);
}

// Start App
init();

// AI 논문 작성 관련 함수들
async function callAiApi(prompt) {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'API 요청 실패');
        }
        
        const data = await response.json();
        return data.text;
    } catch (error) {
        alert('AI 생성 중 오류가 발생했습니다: ' + error.message);
        console.error(error);
        return null;
    }
}

function renderWriteStep() {
    const container = document.getElementById('write-container');
    if (!container) return;
    
    let html = '';
    
    if (state.write.step === 1) {
        html = `
            <div class="result-card">
                <h3 class="result-title">1단계: 연구 주제 선정</h3>
                <p class="result-meta">관심 있는 연구 분야를 입력하면 AI가 적절한 논문 주제를 3가지 추천해 줍니다.</p>
                <div class="search-box" style="margin-top: 1rem; margin-bottom: 0;">
                    <input type="text" id="write-input" class="search-input" placeholder="예: 전기자동차 배터리 효율, 인공지능 윤리..." value="${state.write.topic}">
                    <button class="primary-btn" onclick="goToStep2()">주제 추천받기</button>
                </div>
                <div id="write-loading" style="display:none; text-align:center; padding:2rem;">
                    <i data-lucide="loader-2" class="lucide-spin" style="width: 2rem; height: 2rem; color: var(--primary);"></i>
                    <p style="margin-top: 1rem; color: var(--text-muted);">AI가 최신 논문 트렌드를 분석하여 주제를 구상 중입니다...</p>
                </div>
                <div id="write-results" style="margin-top: 1.5rem;"></div>
            </div>
        `;
    } 
    else if (state.write.step === 2) {
        html = `
            <div class="result-card" style="border-left: 4px solid var(--menu-purple-text);">
                <h3 class="result-title">2단계: 목차 구성하기</h3>
                <p class="result-meta">선택하신 주제 <strong>"${state.write.selectedTitle}"</strong>에 대한 목차(Outline) 초안입니다. 내용을 자유롭게 수정하세요.</p>
                <textarea id="outline-editor" style="width: 100%; height: 200px; margin-top: 1rem; padding: 1rem; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; line-height: 1.6;">${state.write.outline}</textarea>
                <div style="display: flex; gap: 1rem; margin-top: 1rem; justify-content: flex-end;">
                    <button class="icon-text-btn" onclick="state.write.step = 1; renderWriteStep();">이전 단계</button>
                    <button class="primary-btn" onclick="goToStep3()" id="step3-btn">3단계: 본론 작성하기 <i data-lucide="arrow-right"></i></button>
                </div>
            </div>
        `;
    }
    else if (state.write.step === 3) {
        html = `
            <div class="result-card" style="border-left: 4px solid var(--menu-emerald-text);">
                <h3 class="result-title">3단계: 서론 및 본론 작성</h3>
                <p class="result-meta">AI가 목차를 바탕으로 서론과 본론의 초안을 작성했습니다. 자유롭게 편집해 보세요.</p>
                <textarea id="draft-editor" style="width: 100%; height: 350px; margin-top: 1rem; padding: 1rem; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; line-height: 1.6;">${state.write.draft}</textarea>
                <div style="display: flex; gap: 1rem; margin-top: 1rem; justify-content: flex-end;">
                    <button class="icon-text-btn" onclick="state.write.step = 2; renderWriteStep();">이전 단계</button>
                    <button class="primary-btn" onclick="goToStep4()" id="step4-btn">4단계: 결론 도출하기 <i data-lucide="arrow-right"></i></button>
                </div>
            </div>
        `;
    }
    else if (state.write.step === 4) {
        html = `
            <div class="result-card" style="border-left: 4px solid var(--menu-amber-text);">
                <h3 class="result-title">4단계: 결론 도출 및 검토</h3>
                <p class="result-meta">본론을 바탕으로 도출된 결론입니다. 논문의 완성도를 높여보세요.</p>
                <textarea id="conclusion-editor" style="width: 100%; height: 200px; margin-top: 1rem; padding: 1rem; background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; line-height: 1.6;">${state.write.conclusion}</textarea>
                <div style="display: flex; gap: 1rem; margin-top: 1rem; justify-content: flex-end;">
                    <button class="icon-text-btn" onclick="state.write.step = 3; renderWriteStep();">이전 단계</button>
                    <button class="primary-btn" onclick="goToStep5()">최종 논문 완성하기 <i data-lucide="check-circle"></i></button>
                </div>
            </div>
        `;
    }
    else if (state.write.step === 5) {
        const fullPaper = `# ${state.write.selectedTitle}\n\n## 서론 및 본론\n${state.write.draft}\n\n## 결론\n${state.write.conclusion}`;
        html = `
            <div class="result-card" style="border-left: 4px solid var(--primary); background: var(--menu-blue);">
                <h3 class="result-title"><i data-lucide="award"></i> 5단계: 최종 논문 완성</h3>
                <p class="result-meta">축하합니다! AI와 함께 논문 초안 작성을 완료했습니다.</p>
                <div style="background: var(--bg-main); padding: 1.5rem; margin-top: 1rem; border-radius: 8px; border: 1px solid var(--border-color); max-height: 400px; overflow-y: auto; white-space: pre-wrap; line-height: 1.6; font-size: 0.95rem;">${fullPaper}</div>
                <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: center;">
                    <button class="icon-text-btn" onclick="state.write.step = 4; renderWriteStep();">수정하러 가기</button>
                    <button class="primary-btn" onclick="alert('논문 파일 다운로드 기능은 추후 연동됩니다!')"><i data-lucide="download"></i> 텍스트(.txt)로 다운로드</button>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
    
    if (!document.getElementById('spin-anim')) {
        const style = document.createElement('style');
        style.id = 'spin-anim';
        style.innerHTML = '@keyframes spin { 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }
    lucide.createIcons();
}

window.goToStep2 = async function() {
    const input = document.getElementById('write-input').value;
    if (!input.trim()) { alert('분야를 입력해주세요.'); return; }
    
    state.write.topic = input;
    document.getElementById('write-loading').style.display = 'block';
    document.getElementById('write-results').innerHTML = '';
    
    const prompt = `학술 논문을 작성하려고 합니다. 연구 분야는 "${input}" 입니다. 이 분야에서 현재 가장 학술적으로 가치있고 트렌디한 논문 주제(제목) 3가지를 추천해주세요. 번호 매기기로 3개만 간결하게 응답해주세요.`;
    
    const result = await callAiApi(prompt);
    document.getElementById('write-loading').style.display = 'none';
    
    if (result) {
        // 간단한 파싱
        const topics = result.split('\n').filter(line => line.trim().match(/^\d/)).map(line => line.replace(/^\d+[\.\)]\s*/, '').trim());
        
        let html = `
            <div class="result-card" style="border-left: 4px solid var(--menu-purple-text); background: var(--menu-purple); animation: fadeIn 0.5s;">
                <h4 style="color: var(--menu-purple-text); margin-bottom: 0.5rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="sparkles"></i> AI 추천 연구 주제</h4>
                <p style="font-size: 0.875rem; line-height: 1.6; margin-bottom: 1rem;">원하시는 논문 주제를 하나 선택해주세요.</p>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        `;
        
        topics.forEach((topic, i) => {
            html += `<button class="icon-text-btn" style="text-align: left; background: var(--bg-main); border: 1px solid var(--border-color); padding: 1rem; width: 100%; white-space: normal;" onclick="selectTopic('${topic.replace(/'/g, "\\'")}', this)">${i+1}. ${topic}</button>`;
        });
        
        html += `</div></div>`;
        document.getElementById('write-results').innerHTML = html;
        lucide.createIcons();
    }
}

window.selectTopic = async function(topic, btn) {
    state.write.selectedTitle = topic;
    
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="lucide-spin"></i> 목차 생성 중...`;
    lucide.createIcons();
    
    const prompt = `선택된 논문 주제는 "${topic}" 입니다. 이 논문의 학술적인 목차(서론, 본론(이론적 배경, 연구방법 등), 결론)를 논리적으로 구성해주세요. 너무 길지 않게 핵심만 마크다운 포맷으로 작성해주세요.`;
    
    const outline = await callAiApi(prompt);
    
    if (outline) {
        state.write.outline = outline;
        state.write.step = 2;
        renderWriteStep();
    } else {
        btn.innerHTML = originalText;
    }
}

window.goToStep3 = async function() {
    const outline = document.getElementById('outline-editor').value;
    state.write.outline = outline;
    
    const btn = document.getElementById('step3-btn');
    btn.innerHTML = `<i data-lucide="loader-2" class="lucide-spin"></i> 초안 작성 중... (약 10초 소요)`;
    lucide.createIcons();
    
    const prompt = `주제: "${state.write.selectedTitle}"\n목차:\n${outline}\n\n위 목차를 바탕으로 논문의 '서론'과 '본론' 부분의 초안을 1500자 내외로 매우 학술적이고 전문적인 어조로 작성해주세요. 결론 부분은 제외하고 작성하세요.`;
    
    const draft = await callAiApi(prompt);
    
    if (draft) {
        state.write.draft = draft;
        state.write.step = 3;
        renderWriteStep();
    } else {
        btn.innerHTML = `3단계: 본론 작성하기 <i data-lucide="arrow-right"></i>`;
        lucide.createIcons();
    }
}

window.goToStep4 = async function() {
    const draft = document.getElementById('draft-editor').value;
    state.write.draft = draft;
    
    const btn = document.getElementById('step4-btn');
    btn.innerHTML = `<i data-lucide="loader-2" class="lucide-spin"></i> 결론 도출 중...`;
    lucide.createIcons();
    
    const prompt = `주제: "${state.write.selectedTitle}"\n서론 및 본론:\n${draft}\n\n위 내용을 바탕으로 논문의 '결론'과 '향후 연구 방향'을 500자 내외로 요약하여 전문적으로 작성해주세요.`;
    
    const conclusion = await callAiApi(prompt);
    
    if (conclusion) {
        state.write.conclusion = conclusion;
        state.write.step = 4;
        renderWriteStep();
    } else {
        btn.innerHTML = `4단계: 결론 도출하기 <i data-lucide="arrow-right"></i>`;
        lucide.createIcons();
    }
}

window.goToStep5 = function() {
    state.write.conclusion = document.getElementById('conclusion-editor').value;
    state.write.step = 5;
    renderWriteStep();
}
