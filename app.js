// App State
const state = {
    theme: localStorage.getItem('theme') || 'light'
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
        render: () => `
            <div class="result-card">
                <h3 class="result-title">1단계: 연구 주제 선정</h3>
                <p class="result-meta">AI와 대화하며 연구 주제를 구체화합니다.</p>
                <div class="search-box" style="margin-top: 1rem; margin-bottom: 0;">
                    <input type="text" id="write-input" class="search-input" placeholder="어떤 분야의 논문을 작성하고 싶으신가요?">
                    <button class="primary-btn" onclick="startAiWrite()">작성 시작</button>
                </div>
                <div id="write-results" style="margin-top: 1.5rem;"></div>
            </div>
        `
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

// AI 논문 작성 1단계 데모 함수
window.startAiWrite = function() {
    const input = document.getElementById('write-input').value;
    const resultsContainer = document.getElementById('write-results');
    
    if (!input.trim()) {
        alert('작성하고 싶은 분야나 주제를 입력해주세요.');
        return;
    }

    // Show Loading
    resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i data-lucide="loader-2" class="lucide-spin" style="width: 2rem; height: 2rem; color: var(--primary); animation: spin 1s linear infinite;"></i>
            <p style="margin-top: 1rem; color: var(--text-muted);">AI가 '${input}' 분야의 최신 연구 동향을 분석하여 주제를 구상 중입니다...</p>
        </div>
    `;
    lucide.createIcons();
    
    // Add spin animation dynamically if not exists
    if (!document.getElementById('spin-anim')) {
        const style = document.createElement('style');
        style.id = 'spin-anim';
        style.innerHTML = '@keyframes spin { 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
    }

    setTimeout(() => {
        resultsContainer.innerHTML = `
            <div class="result-card" style="border-left: 4px solid var(--menu-purple-text); background: var(--menu-purple); animation: fadeIn 0.5s;">
                <h4 style="color: var(--menu-purple-text); margin-bottom: 0.5rem; display:flex; align-items:center; gap:0.5rem;"><i data-lucide="sparkles"></i> AI 추천 연구 주제</h4>
                <p style="font-size: 0.875rem; line-height: 1.6; margin-bottom: 1rem;">
                    입력하신 <strong>"${input}"</strong> 분야는 최근 학계에서 활발한 연구가 진행되고 있습니다. 다음 3가지 세부 주제 중 하나를 선택하여 논문을 전개해보는 것을 추천합니다.
                </p>
                <ol style="margin-left: 1.5rem; font-size: 0.875rem; line-height: 1.8; margin-bottom: 1.5rem;">
                    <li>${input} 시스템의 최적화 알고리즘 설계 및 성능 평가</li>
                    <li>딥러닝 기법을 적용한 차세대 ${input} 소자 결함 탐지 방법론</li>
                    <li>${input} 기술을 활용한 데이터 처리 지연시간 최소화 방안</li>
                </ol>
                <button class="primary-btn" style="background: var(--menu-purple-text); margin:0 auto;" onclick="alert('다음 단계로 진행합니다. (구현 예정)')">2단계: 목차 구성하기 <i data-lucide="arrow-right"></i></button>
            </div>
        `;
        lucide.createIcons();
    }, 2000);
}
