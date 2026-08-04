// App State
const state = {
    theme: localStorage.getItem('theme') || 'light',
    settings: {
        aiProvider: localStorage.getItem('aiProvider') || 'openai',
        aiKey: localStorage.getItem('aiKey') || '',
        serpKey: localStorage.getItem('serpKey') || ''
    }
};

// DOM Elements
const body = document.body;
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const mainContent = document.getElementById('main-content');

// Settings Elements
const aiProviderSelect = document.getElementById('ai-provider-select');
const aiKeyInput = document.getElementById('ai-api-key');
const aiKeyLabel = document.getElementById('ai-key-label');
const serpKeyInput = document.getElementById('serp-api-key');
const saveSettingsBtn = document.getElementById('save-settings-btn');

// Initialize
function init() {
    applyTheme();
    setupEventListeners();
    handleRoute();
    lucide.createIcons();
    
    // Load Settings to UI
    aiProviderSelect.value = state.settings.aiProvider;
    aiKeyInput.value = state.settings.aiKey;
    serpKeyInput.value = state.settings.serpKey;
    updateAiKeyLabel();
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

function updateAiKeyLabel() {
    const provider = aiProviderSelect.value;
    if (provider === 'openai') aiKeyLabel.textContent = 'OpenAI API Key';
    else if (provider === 'gemini') aiKeyLabel.textContent = 'Gemini API Key';
    else if (provider === 'anthropic') aiKeyLabel.textContent = 'Anthropic (Claude) API Key';
}

function saveSettings() {
    state.settings.aiProvider = aiProviderSelect.value;
    state.settings.aiKey = aiKeyInput.value;
    state.settings.serpKey = serpKeyInput.value;
    
    localStorage.setItem('aiProvider', state.settings.aiProvider);
    localStorage.setItem('aiKey', state.settings.aiKey);
    localStorage.setItem('serpKey', state.settings.serpKey);
    
    settingsModal.classList.add('hidden');
    alert('API 설정이 저장되었습니다.');
}

function setupEventListeners() {
    // Sidebar
    mobileMenuBtn.addEventListener('click', () => sidebar.classList.add('open'));
    closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));
    
    // Theme
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Settings
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.add('hidden');
    });
    
    aiProviderSelect.addEventListener('change', updateAiKeyLabel);
    saveSettingsBtn.addEventListener('click', saveSettings);
    
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
                    <input type="text" class="search-input" placeholder="어떤 분야의 논문을 작성하고 싶으신가요?">
                    <button class="primary-btn">작성 시작</button>
                </div>
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

// Mock Search Function
window.mockSearch = function(type) {
    const resultsContainer = document.getElementById('search-results');
    
    // Show Loading
    resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i data-lucide="loader-2" class="lucide-spin" style="width: 2rem; height: 2rem; color: var(--primary); animation: spin 1s linear infinite;"></i>
            <p style="margin-top: 1rem; color: var(--text-muted);">논문 데이터를 가져오는 중입니다...</p>
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
        // Mock Results
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
