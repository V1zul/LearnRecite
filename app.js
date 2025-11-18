// Configuration
let GEMINI_API_KEY = ''; // Will be loaded from .env or user input
let OAUTH_CLIENT_ID = ''; // Google OAuth Client ID
let OAUTH_ACCESS_TOKEN = ''; // OAuth access token
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';

// OAuth Configuration - Update this with your OAuth Client ID
const DEFAULT_OAUTH_CLIENT_ID = '37059000813-9ucu7gqfd37sij6f5d226vv3kmedaod2.apps.googleusercontent.com';

// State management
let recognition = null;
let isRecording = false;
let recordedAudio = null;
let currentVerse = null;
let currentQeerat = null;

// Rate limiting and request management
let lastApiCallTime = 0;
let apiCallQueue = [];
let isProcessingQueue = false;
const MIN_TIME_BETWEEN_CALLS = 1000; // 1 second minimum between API calls
const MAX_CONCURRENT_REQUESTS = 1; // Only one request at a time
let activeRequests = 0;

// Cache for recent requests to avoid duplicates
const requestCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds cache

// Available reciters with their identifiers for different CDNs
const reciters = {
    'mishary_rashid': { 
        name: 'Mishary Rashid Alafasy', 
        identifier: 'mishary_rashid_alafasy',
        everyayah: 'MisharyRashidAlafasy_128kbps',
        qurancom: 'mishary_rashid_alafasy',
        quranapi: 'ar.alafasy', // Quran.com API identifier
        mp3quran: 'mishary_rashid_alafasy'
    },
    'abdul_basit': { 
        name: 'Abdul Basit Abdul Samad', 
        identifier: 'abdul_basit_murattal',
        everyayah: 'Abdul_Basit_Murattal_128kbps',
        qurancom: 'abdul_basit_murattal',
        quranapi: 'ar.abdulbasitmurattal',
        mp3quran: 'abdul_basit_murattal'
    },
    'saad_al_ghamdi': { 
        name: 'Saad Al-Ghamdi', 
        identifier: 'saad_al_ghamdi',
        everyayah: 'Saad_Al_Ghamdi_128kbps',
        qurancom: 'saad_al_ghamdi',
        quranapi: 'ar.saadalghamdi',
        mp3quran: 'saad_al_ghamdi'
    },
    'abdurrahman_sudais': { 
        name: 'Abdur-Rahman As-Sudais', 
        identifier: 'abdurrahman_as_sudais',
        everyayah: 'Abdurrahmaan_As-Sudais_128kbps',
        qurancom: 'abdurrahman_as_sudais',
        quranapi: 'ar.abdurrahmaansudais',
        mp3quran: 'abdurrahman_as_sudais'
    },
    'maher_al_muaiqly': { 
        name: 'Maher Al Muaiqly', 
        identifier: 'maher_al_muaiqly',
        everyayah: 'Maher_AlMuaiqly_128kbps',
        qurancom: 'maher_al_muaiqly',
        quranapi: 'ar.mahermuaiqly',
        mp3quran: 'maher_al_muaiqly'
    },
    'abdullah_basfar': { 
        name: 'Abdullah Basfar', 
        identifier: 'abdullah_basfar',
        everyayah: 'Abdullah_Basfar_128kbps',
        qurancom: 'abdullah_basfar',
        quranapi: 'ar.abdullahbasfar',
        mp3quran: 'abdullah_basfar'
    },
    'hani_rifai': { 
        name: 'Hani Rifai', 
        identifier: 'hani_rifai',
        everyayah: 'Hani_Rifai_128kbps',
        qurancom: 'hani_rifai',
        quranapi: 'ar.hanirifai',
        mp3quran: 'hani_rifai'
    },
    'hudhaify': { 
        name: 'Ali Jaber (Hudhaify)', 
        identifier: 'hudhaify',
        everyayah: 'Hudhaify_128kbps',
        qurancom: 'hudhaify',
        quranapi: 'ar.hudhaify',
        mp3quran: 'hudhaify'
    },
    // Qira'at-specific reciters - Warsh
    'warsh_nasser_qatami': {
        name: 'Nasser Al Qatami (Warsh)',
        identifier: 'nasser_al_qatami',
        quranapi: 'ar.warsh', // Try AlQuran Cloud edition
        everyayah: 'Nasser_Al_Qatami_128kbps', // Common identifier format
        qurancom: 'nasser_al_qatami',
        mp3quran: 'nasser_al_qatami'
    },
    'warsh_ayman_sowaid': {
        name: 'Ayman Sowaid (Warsh)',
        identifier: 'ayman_sowaid',
        quranapi: 'ar.warsh', // Try AlQuran Cloud edition
        everyayah: 'Ayman_Sowaid_128kbps',
        qurancom: 'ayman_sowaid',
        mp3quran: 'ayman_sowaid'
    },
    // Qira'at-specific reciters - Qaloon
    'qaloon_reciter': {
        name: 'Qaloon Reciter',
        identifier: 'qaloon',
        quranapi: 'ar.qaloon', // Try AlQuran Cloud edition
        everyayah: 'Qaloon_128kbps', // Try common format
        qurancom: 'qaloon',
        mp3quran: 'qaloon'
    }
};

// Current selected reciter
let currentReciter = 'mishary_rashid';
// Current selected reciter for qeerat section
let currentQeeratReciter = null;

// Verse database with surah/ayah information for audio
const verses = {
    'bismillah': {
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
        surah: 1,
        ayah: 1,
        tajweed: [
            'Bismillah: Start with proper intention',
            'Isti\'adhah: Seek refuge before reciting',
            'Proper pronunciation of "Bismillah"',
            'Elongation (madd) in "Ar-Rahman" and "Ar-Raheem"'
        ]
    },
    'fatiha-1': {
        arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ * الرَّحْمَٰنِ الرَّحِيمِ * مَالِكِ يَوْمِ الدِّينِ',
        translation: 'Praise be to Allah, Lord of the worlds, The Most Gracious, The Most Merciful, Master of the Day of Judgment',
        surah: 1,
        ayah: [1, 2, 3],
        tajweed: [
            'Alif Lam: Proper pronunciation of definite article',
            'Madd: Elongation in "Alhamd" and "Rabb"',
            'Qalqalah: Echo sound in "Qaf" of "Rabb"',
            'Ikhfa: Hidden pronunciation in certain letters'
        ]
    },
    'fatiha-4': {
        arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ * اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ * صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ',
        translation: 'You alone we worship, and You alone we ask for help. Guide us to the straight path, The path of those upon whom You have bestowed favor',
        surah: 1,
        ayah: [4, 5, 6],
        tajweed: [
            'Idgham: Merging of letters',
            'Iqlab: Conversion of nun to meem',
            'Proper stopping (waqf) points',
            'Madd: Elongation in "Iyyaka"'
        ]
    },
    'ikhlas': {
        arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ * اللَّهُ الصَّمَدُ * لَمْ يَلِدْ وَلَمْ يُولَدْ * وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
        translation: 'Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born, Nor is there to Him any equivalent.',
        surah: 112,
        ayah: 'all', // Full surah
        tajweed: [
            'Qalqalah: Echo in "Qaf" of "Qul"',
            'Proper pronunciation of "Ahad"',
            'Madd: Elongation in "As-Samad"',
            'Ikhfa: Hidden nun in "Lam Yalid"'
        ]
    },
    'nasr': {
        arabic: 'إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ * وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا * فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ ۚ إِنَّهُ كَانَ تَوَّابًا',
        translation: 'When the victory of Allah has come and the conquest, And you see the people entering into the religion of Allah in multitudes, Then exalt [Him] with praise of your Lord and ask forgiveness of Him. Indeed, He is ever Accepting of repentance.',
        surah: 110,
        ayah: 'all', // Full surah
        tajweed: [
            'Proper stopping at verse endings',
            'Madd: Elongation in "Nasr" and "Fath"',
            'Ikhfa: Hidden pronunciation',
            'Qalqalah: Echo sounds where applicable'
        ]
    }
};

// Qeerat information database with associated reciters
const qeeratInfo = {
    'hafs': {
        name: 'Hafs \'an \'Asim',
        description: 'The most widely used qira\'ah in the world today, especially in the Arab world. It is transmitted from Hafs ibn Sulayman from \'Asim ibn Abi al-Najud.',
        differences: [
            'Most common recitation style globally',
            'Standard in most printed Qurans',
            'Clear pronunciation with moderate elongation',
            'Used in most Islamic countries'
        ],
        example: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        reciters: ['mishary_rashid', 'abdul_basit', 'saad_al_ghamdi', 'abdurrahman_sudais', 'maher_al_muaiqly', 'abdullah_basfar', 'hani_rifai', 'hudhaify'],
        defaultReciter: 'mishary_rashid'
    },
    'warsh': {
        name: 'Warsh \'an Nafi\'',
        description: 'Popular in North and West Africa, especially Morocco, Algeria, and parts of West Africa. Transmitted from Warsh from Nafi\' al-Madani.',
        differences: [
            'Different pronunciation of certain letters',
            'Variations in elongation (madd)',
            'Different stopping points',
            'Popular in Maghreb region'
        ],
        example: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        reciters: ['warsh_nasser_qatami', 'warsh_ayman_sowaid'],
        defaultReciter: 'warsh_nasser_qatami',
        note: 'Limited reciters available for this qira\'ah'
    },
    'qaloon': {
        name: 'Qaloon \'an Nafi\'',
        description: 'Another transmission from Nafi\', popular in Libya and parts of Africa. Known for its distinct characteristics.',
        differences: [
            'Alternative transmission from Nafi\'',
            'Different from Warsh in some aspects',
            'Used in Libya and parts of Africa',
            'Unique pronunciation patterns'
        ],
        example: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        reciters: ['qaloon_reciter'],
        defaultReciter: 'qaloon_reciter',
        note: 'Limited reciters available for this qira\'ah'
    },
    'ibn-kathir': {
        name: 'Ibn Kathir',
        description: 'Transmitted from Ibn Kathir al-Makki, one of the seven canonical qira\'at. Used in parts of Yemen and East Africa.',
        differences: [
            'One of the seven canonical qira\'at',
            'Distinct pronunciation characteristics',
            'Used in Yemen and East Africa',
            'Unique letter pronunciations'
        ],
        example: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        reciters: [],
        defaultReciter: null,
        note: 'Audio recordings for this qira\'ah are not readily available in common APIs. This qira\'ah is primarily of historical and scholarly interest.'
    },
    'abu-amr': {
        name: 'Abu \'Amr',
        description: 'Transmitted from Abu \'Amr ibn al-\'Ala, one of the seven canonical qira\'at with unique characteristics.',
        differences: [
            'One of the seven canonical qira\'at',
            'Distinct elongation patterns',
            'Unique stopping rules',
            'Used in specific regions'
        ],
        example: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        reciters: [],
        defaultReciter: null,
        note: 'Audio recordings for this qira\'ah are not readily available in common APIs. This qira\'ah is primarily of historical and scholarly interest.'
    },
    'ibn-amir': {
        name: 'Ibn \'Amir',
        description: 'Transmitted from Ibn \'Amir al-Dimashqi, one of the seven canonical qira\'at, popular in Syria.',
        differences: [
            'One of the seven canonical qira\'at',
            'Popular in Syria',
            'Distinct pronunciation patterns',
            'Unique characteristics'
        ],
        example: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        reciters: [],
        defaultReciter: null,
        note: 'Audio recordings for this qira\'ah are not readily available in common APIs. This qira\'ah is primarily of historical and scholarly interest.'
    },
    'asim': {
        name: '\'Asim',
        description: 'The base transmission from \'Asim ibn Abi al-Najud, from which Hafs is derived.',
        differences: [
            'Base transmission from \'Asim',
            'Foundation for Hafs recitation',
            'Clear and precise',
            'Historical importance'
        ],
        example: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        reciters: ['mishary_rashid', 'abdul_basit'], // Using Hafs reciters as closest available
        defaultReciter: 'mishary_rashid',
        note: 'Modern reciters primarily use Hafs transmission. The listed reciters use Hafs which is derived from \'Asim.'
    },
    'hamza': {
        name: 'Hamza',
        description: 'Transmitted from Hamza al-Zayyat, one of the seven canonical qira\'at with unique characteristics.',
        differences: [
            'One of the seven canonical qira\'at',
            'Distinct pronunciation patterns',
            'Unique elongation rules',
            'Historical significance'
        ],
        example: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        reciters: [],
        defaultReciter: null,
        note: 'Audio recordings for this qira\'ah are not readily available in common APIs. This qira\'ah is primarily of historical and scholarly interest.'
    },
    'kisai': {
        name: 'Al-Kisai',
        description: 'Transmitted from Al-Kisai, one of the seven canonical qira\'at, known for its unique characteristics.',
        differences: [
            'One of the seven canonical qira\'at',
            'Distinct pronunciation',
            'Unique stopping rules',
            'Historical importance'
        ],
        example: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        reciters: [],
        defaultReciter: null,
        note: 'Audio recordings for this qira\'ah are not readily available in common APIs. This qira\'ah is primarily of historical and scholarly interest.'
    },
    'khalaf': {
        name: 'Khalaf',
        description: 'Transmitted from Khalaf, one of the ten canonical qira\'at, with its own unique characteristics.',
        differences: [
            'One of the ten canonical qira\'at',
            'Distinct pronunciation patterns',
            'Unique characteristics',
            'Less commonly used'
        ],
        example: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        reciters: [],
        defaultReciter: null,
        note: 'Audio recordings for this qira\'ah are not readily available in common APIs. This qira\'ah is primarily of historical and scholarly interest.'
    }
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    await loadAPIKey();
    await loadOAuthConfig();
    if (GEMINI_API_KEY || OAUTH_CLIENT_ID) {
        await checkAvailableModels();
    }
    initializeOAuth();
    initializeNavigation();
    initializeTajweedSection();
    initializeQeeratSection();
    initializeSpeechRecognition();
    initializeSettings();
    updateAPIKeyStatus();
}

// Check which models are available with the API key or OAuth token
async function checkAvailableModels() {
    try {
        let url = `${GEMINI_API_BASE}/v1beta/models`;
        const headers = getAuthHeader();
        
        if (OAUTH_ACCESS_TOKEN) {
            // OAuth authentication
            const response = await fetch(url, { headers });
            if (response.ok) {
                const data = await response.json();
                console.log('Available models (OAuth):', data.models?.map(m => m.name) || 'Could not parse');
                if (data.models && data.models.length > 0) {
                    window.availableModels = data.models.map(m => m.name);
                }
            }
        } else if (GEMINI_API_KEY) {
            // API key authentication
            url += `?key=${GEMINI_API_KEY}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                const modelNames = data.models?.map(m => m.name) || [];
                console.log('Available models (API Key):', modelNames);
                if (modelNames.length > 0) {
                    window.availableModels = modelNames;
                    // Check if gemini-2.5-pro is available
                    const hasGemini25Pro = modelNames.some(m => m.includes('gemini-2.5-pro'));
                    if (hasGemini25Pro) {
                        console.log('✓ gemini-2.5-pro is available!');
                    }
                }
            }
        }
    } catch (error) {
        console.log('Could not fetch available models:', error);
    }
}

// Load OAuth Client ID from .env
async function loadOAuthConfig() {
    try {
        const response = await fetch('.env');
        if (response.ok) {
            const text = await response.text();
            text.split(/\r?\n/).forEach((line) => {
                if (!line || line.trim().startsWith('#')) return;
                const [rawKey, ...rawValue] = line.split('=');
                if (!rawKey || rawValue.length === 0) return;
                const key = rawKey.trim();
                const value = rawValue.join('=').trim().replace(/^['"]|['"]$/g, '');
                if (key === 'OAUTH_CLIENT_ID' || key === 'OAuthClientId') {
                    OAUTH_CLIENT_ID = value;
                }
            });
        }
    } catch (error) {
        console.log('No OAuth config in .env file');
    }
    
    // Use default if not found
    if (!OAUTH_CLIENT_ID) {
        OAUTH_CLIENT_ID = DEFAULT_OAUTH_CLIENT_ID;
    }
    
    // Check localStorage for OAuth token
    const storedToken = localStorage.getItem('oauth_access_token');
    if (storedToken) {
        OAUTH_ACCESS_TOKEN = storedToken;
        console.log('OAuth token loaded from localStorage');
    }
}

// Initialize Google OAuth
function initializeOAuth() {
    // Wait for Google Identity Services to load
    if (typeof google === 'undefined' || !google.accounts) {
        setTimeout(initializeOAuth, 100);
        return;
    }

    // Only initialize OAuth if we have a valid client ID and no API key
    // OAuth requires the origin to be authorized in Google Cloud Console
    if (!OAUTH_CLIENT_ID || GEMINI_API_KEY) {
        const oauthContainer = document.getElementById('oauth-container');
        if (oauthContainer) {
            oauthContainer.style.display = 'none';
        }
        return;
    }

    try {
        google.accounts.id.initialize({
            client_id: OAUTH_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        // Render sign-in button
        const oauthContainer = document.getElementById('oauth-container');
        if (oauthContainer) {
            google.accounts.id.renderButton(
                oauthContainer,
                {
                    theme: 'outline',
                    size: 'large',
                    text: 'signin_with',
                    width: 250
                }
            );
        }
    } catch (error) {
        console.warn('OAuth initialization failed:', error);
        console.warn('Note: OAuth requires the origin to be authorized in Google Cloud Console');
        const oauthContainer = document.getElementById('oauth-container');
        if (oauthContainer) {
            oauthContainer.style.display = 'none';
        }
    }
}

// Handle OAuth credential response
async function handleCredentialResponse(response) {
    try {
        // Exchange credential for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: OAUTH_CLIENT_ID,
                code: response.credential,
                grant_type: 'authorization_code',
                redirect_uri: window.location.origin
            })
        });

        if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            OAUTH_ACCESS_TOKEN = tokenData.access_token;
            localStorage.setItem('oauth_access_token', OAUTH_ACCESS_TOKEN);
            updateAPIKeyStatus();
            console.log('OAuth authentication successful');
        } else {
            // Try using the credential directly as a token
            OAUTH_ACCESS_TOKEN = response.credential;
            localStorage.setItem('oauth_access_token', OAUTH_ACCESS_TOKEN);
            updateAPIKeyStatus();
            console.log('OAuth credential stored');
        }
    } catch (error) {
        console.error('OAuth error:', error);
        // Fallback: use credential as token
        OAUTH_ACCESS_TOKEN = response.credential;
        localStorage.setItem('oauth_access_token', OAUTH_ACCESS_TOKEN);
        updateAPIKeyStatus();
    }
}

// Get authentication header for API calls
function getAuthHeader() {
    if (OAUTH_ACCESS_TOKEN) {
        return { 'Authorization': `Bearer ${OAUTH_ACCESS_TOKEN}` };
    } else if (GEMINI_API_KEY) {
        return {}; // API key goes in URL
    }
    return {};
}

// Get API URL with authentication
function getApiUrl(version, model) {
    if (OAUTH_ACCESS_TOKEN) {
        return `${GEMINI_API_BASE}/${version}/models/${model}:generateContent`;
    } else if (GEMINI_API_KEY) {
        return `${GEMINI_API_BASE}/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    }
    return null;
}

// Load API key from .env or prompt user
async function loadAPIKey() {
    try {
        const response = await fetch('.env');
        if (response.ok) {
            const text = await response.text();
            text.split(/\r?\n/).forEach((line) => {
                if (!line || line.trim().startsWith('#')) return;
                const [rawKey, ...rawValue] = line.split('=');
                if (!rawKey || rawValue.length === 0) return;
                const key = rawKey.trim();
                const value = rawValue.join('=').trim().replace(/^['"]|['"]$/g, '');
                if (key === 'GEMINI_API_KEY' || key === 'GeminiApiKey') {
                    GEMINI_API_KEY = value;
                }
            });
            if (GEMINI_API_KEY) {
                console.log('API key loaded from .env file');
                return;
            }
        }
    } catch (error) {
        console.log('No .env file found or error reading it');
    }

    // If no .env file, check if key is stored in localStorage
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
        GEMINI_API_KEY = storedKey;
        console.log('API key loaded from localStorage');
        return;
    }

    // Show a more user-friendly prompt
    const userKey = prompt('Please enter your Google Gemini API key:\n\nGet your key from: https://makersuite.google.com/app/apikey\n\n(You can also create a .env file with GEMINI_API_KEY=your_key)');
    if (userKey && userKey.trim()) {
        GEMINI_API_KEY = userKey.trim();
        localStorage.setItem('gemini_api_key', GEMINI_API_KEY);
        console.log('API key saved to localStorage');
    } else {
        console.warn('API key not provided. AI features will be disabled.');
        // Don't show alert, just log - user can add key later
    }
}

// Navigation
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn[data-section]');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;
            
            navButtons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(targetSection).classList.add('active');
        });
    });
}

// Tajweed Section
function initializeTajweedSection() {
    const verseSelect = document.getElementById('verse-select');
    const reciterSelect = document.getElementById('reciter-select');
    const startBtn = document.getElementById('start-recording');
    const stopBtn = document.getElementById('stop-recording');
    const playRefBtn = document.getElementById('play-reference');

    verseSelect.addEventListener('change', (e) => {
        const verseKey = e.target.value;
        if (verseKey && verseKey !== 'custom') {
            loadVerse(verseKey);
        } else if (verseKey === 'custom') {
            const customText = prompt('Enter Arabic text to practice:');
            if (customText) {
                loadCustomVerse(customText);
            }
        }
    });

    reciterSelect.addEventListener('change', (e) => {
        currentReciter = e.target.value;
    });

    startBtn.addEventListener('click', startRecording);
    stopBtn.addEventListener('click', stopRecording);
    playRefBtn.addEventListener('click', playReferenceAudio);
}

function loadVerse(verseKey, verseData = null) {
    const verse = verseData || verses[verseKey];
    if (!verse) return;
    currentVerse = verse;

    document.getElementById('arabic-text').innerHTML = `<p>${verse.arabic}</p>`;
    document.getElementById('translation').textContent = verse.translation;
    
    const rulesContent = document.getElementById('rules-content');
    rulesContent.innerHTML = verse.tajweed.map(rule => 
        `<div class="rule-item">${rule}</div>`
    ).join('');
}

function loadCustomVerse(text) {
    const customVerse = {
        arabic: text,
        translation: 'Custom verse for practice',
        tajweed: ['Practice this custom text with proper tajweed rules']
    };
    loadVerse('custom', customVerse);
}

// Speech Recognition
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'ar-SA'; // Arabic (Saudi Arabia)

        recognition.onstart = () => {
            isRecording = true;
            updateRecordingStatus('recording', '🎤 Recording... Speak now');
        };

        recognition.onresult = async (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join(' ');
            
            if (event.results[event.results.length - 1].isFinal) {
                await analyzeRecitation(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            updateRecordingStatus('error', `Error: ${event.error}`);
            stopRecording();
        };

        recognition.onend = () => {
            if (isRecording) {
                recognition.start(); // Restart if still recording
            }
        };
    } else {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    }
}

function startRecording() {
    if (!recognition) {
        alert('Speech recognition not available. Please use a supported browser.');
        return;
    }

    if (!currentVerse) {
        alert('Please select a verse first.');
        return;
    }

    if (!GEMINI_API_KEY) {
        alert('Please configure your Gemini API key first.');
        return;
    }

    try {
        recognition.start();
        document.getElementById('start-recording').disabled = true;
        document.getElementById('stop-recording').disabled = false;
    } catch (error) {
        console.error('Error starting recognition:', error);
    }
}

function stopRecording() {
    if (recognition) {
        recognition.stop();
        isRecording = false;
        document.getElementById('start-recording').disabled = false;
        document.getElementById('stop-recording').disabled = true;
        updateRecordingStatus('success', 'Recording stopped. Processing...');
    }
}

function updateRecordingStatus(type, message) {
    const statusEl = document.getElementById('recording-status');
    statusEl.textContent = message;
    statusEl.className = `recording-status ${type}`;
}

// Rate-limited API call wrapper
async function makeRateLimitedApiCall(apiCallFunction) {
    // Check if we have too many active requests
    if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
        return new Promise((resolve) => {
            apiCallQueue.push({ fn: apiCallFunction, resolve });
        });
    }

    // Check minimum time between calls
    const timeSinceLastCall = Date.now() - lastApiCallTime;
    if (timeSinceLastCall < MIN_TIME_BETWEEN_CALLS) {
        await new Promise(resolve => setTimeout(resolve, MIN_TIME_BETWEEN_CALLS - timeSinceLastCall));
    }

    activeRequests++;
    lastApiCallTime = Date.now();

    try {
        const result = await apiCallFunction();
        return result;
    } finally {
        activeRequests--;
        // Process next item in queue
        if (apiCallQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
            const next = apiCallQueue.shift();
            makeRateLimitedApiCall(next.fn).then(next.resolve);
        }
    }
}

// AI Analysis using Google Gemini
async function analyzeRecitation(transcript) {
    if (!currentVerse || (!GEMINI_API_KEY && !OAUTH_ACCESS_TOKEN)) return;

    const loadingEl = document.getElementById('loading');
    const feedbackEl = document.getElementById('feedback-content');
    
    loadingEl.style.display = 'flex';
    feedbackEl.innerHTML = '';

    // Create cache key
    const cacheKey = `recitation_${currentVerse.arabic}_${transcript}`;
    const cached = requestCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log('Using cached response');
        displayFeedback(cached.response);
        loadingEl.style.display = 'none';
        return;
    }

    // Optimized shorter prompt for faster responses
    const prompt = `Expert Tajweed teacher. Analyze recitation:

Correct: "${currentVerse.arabic}"
User said: "${transcript}"

Provide:
1. Score (0-100)
2. Tajweed errors (madd, qalqalah, ikhfa, idgham, etc.)
3. Pronunciation mistakes
4. What was correct
5. Corrections

Be concise, encouraging, and precise.`;

    // Wrap the API call in rate limiting
    await makeRateLimitedApiCall(async () => {
        await performApiCall(prompt, loadingEl, feedbackEl, cacheKey);
    });
}

// Perform the actual API call
async function performApiCall(prompt, loadingEl, feedbackEl, cacheKey) {

    // Try fastest models first for quick responses
    // Flash models are much faster and less likely to be overloaded
    // Only use models that are actually available (based on API response)
    const apiConfigs = [
        { version: 'v1beta', model: 'gemini-2.5-flash' },
        { version: 'v1beta', model: 'gemini-2.5-flash-preview-05-20' },
        { version: 'v1beta', model: 'gemini-flash-latest' },
        { version: 'v1beta', model: 'gemini-2.5-flash-lite' },
        { version: 'v1beta', model: 'gemini-2.0-flash' },
        { version: 'v1beta', model: 'gemini-2.0-flash-001' },
        // Pro models as last resort (often overloaded)
        { version: 'v1beta', model: 'gemini-2.5-pro' },
        { version: 'v1beta', model: 'gemini-2.5-pro-preview-06-05' },
        { version: 'v1beta', model: 'gemini-2.5-pro-preview-05-06' },
        { version: 'v1beta', model: 'gemini-pro-latest' },
        { version: 'v1', model: 'gemini-pro' }
    ];

    let lastError = null;
    for (const config of apiConfigs) {
        try {
            const apiUrl = getApiUrl(config.version, config.model);
            if (!apiUrl) {
                lastError = new Error('No authentication method available');
                continue;
            }
            
            const headers = {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            };
            
            // Add timeout and optimize request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.8,
                        topK: 40,
                        maxOutputTokens: 500 // Limit response length for speed
                    }
                })
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `API error: ${response.status}`;
                let errorDetails = null;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error?.message || errorMessage;
                    errorDetails = errorData.error;
                    console.error(`API Error for ${config.version}/${config.model}:`, errorDetails);
                    // Log full error for debugging
                    if (response.status === 400) {
                        console.error('Full 400 error response:', errorData);
                    }
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                    console.error('Error parsing error response:', e, errorText);
                }
                lastError = new Error(errorMessage);
                // Handle different error types
                if (response.status === 400) {
                    console.warn(`Model ${config.model} returned 400 - trying next model...`);
                } else if (response.status === 503) {
                    console.warn(`Model ${config.model} is overloaded (503) - trying next model...`);
                    // Small delay before trying next model to avoid hammering the API
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else if (response.status === 429) {
                    console.warn(`Model ${config.model} rate limited (429) - trying next model...`);
                    // Longer delay for rate limits
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                continue; // Try next configuration
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                lastError = new Error('Unexpected API response format');
                continue;
            }
            
            const feedback = data.candidates[0].content.parts[0].text;
            console.log(`✓ Success with ${config.model}!`);
            
            // Cache the response
            if (cacheKey) {
                requestCache.set(cacheKey, {
                    response: feedback,
                    timestamp: Date.now()
                });
                // Clean old cache entries (keep only last 10)
                if (requestCache.size > 10) {
                    const firstKey = requestCache.keys().next().value;
                    requestCache.delete(firstKey);
                }
            }
            
            displayFeedback(feedback);
            loadingEl.style.display = 'none';
            return; // Success!
        } catch (error) {
            if (error.name === 'AbortError') {
                lastError = new Error('Request timeout - model took too long to respond');
                console.warn(`Timeout for ${config.model}, trying next model...`);
            } else {
                lastError = error;
            }
            continue; // Try next configuration
        }
    }

    // If all configurations failed
    console.error('Error calling Gemini API:', lastError);
    const errorMsg = lastError?.message || 'All API configurations failed';
    feedbackEl.innerHTML = `
        <div class="feedback-item error">
            <strong>Error:</strong> Could not analyze recitation. All model attempts failed.
            <br><small>Error details: ${errorMsg}</small>
            <br><br><strong>Possible solutions:</strong>
            <ul style="text-align: left; margin: 10px 0;">
                <li>Check if billing is enabled in your Google Cloud project</li>
                <li>Verify the Generative Language API is enabled in Google Cloud Console</li>
                <li>Ensure your API key has the correct permissions</li>
                <li>Try creating a new API key from <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
                <li>Check the browser console for available models (F12 → Console)</li>
                <li>Wait a moment and try again (models may be temporarily overloaded)</li>
            </ul>
            <br><small>If you see "Available models" in the console, those are the models your API key can access.</small>
        </div>
    `;
    loadingEl.style.display = 'none';
}

function displayFeedback(feedback) {
    const feedbackEl = document.getElementById('feedback-content');
    
    // Parse feedback and format it nicely
    const lines = feedback.split('\n').filter(line => line.trim());
    let html = '';

    lines.forEach(line => {
        if (line.match(/^\d+\./)) {
            // Numbered list item
            html += `<div class="feedback-item">${line}</div>`;
        } else if (line.match(/^[A-Z]/) && line.length > 50) {
            // Likely a section header or important point
            html += `<div class="feedback-item">${line}</div>`;
        } else {
            // Regular paragraph
            html += `<p>${line}</p>`;
        }
    });

    feedbackEl.innerHTML = html || `<div class="feedback-item">${feedback}</div>`;
}

async function playReferenceAudio() {
    if (!currentVerse) {
        alert('Please select a verse first.');
        return;
    }

    // For custom verses, fall back to TTS
    if (!currentVerse.surah) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(currentVerse.arabic);
            utterance.lang = 'ar-SA';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        } else {
            alert('Audio playback not supported in your browser.');
        }
        return;
    }

    const audioElement = document.getElementById('reference-audio');
    const playBtn = document.getElementById('play-reference');
    
    try {
        playBtn.disabled = true;
        playBtn.innerHTML = '<span class="icon">⏳</span> Loading Audio...';

        // Get reciter identifier
        const reciter = reciters[currentReciter];
        if (!reciter) {
            throw new Error('Reciter not found');
        }

        // Build audio URL - try multiple reliable sources
        const surahStr = String(currentVerse.surah).padStart(3, '0');
        
        // Try multiple audio sources in order (most reliable first)
        const audioSources = [];
        
        if (currentVerse.ayah === 'all') {
            // Full surah - try multiple sources (direct MP3 URLs first for faster loading)
            // EveryAyah (most reliable direct MP3)
            audioSources.push({ type: 'direct', url: `https://everyayah.com/data/${reciter.everyayah}/mp3/${surahStr}.mp3` });
            // Quran.com CDN (direct MP3)
            audioSources.push({ type: 'direct', url: `https://cdn.islamic.network/quran/audio-surah/128/${reciter.qurancom}/${currentVerse.surah}.mp3` });
            // MP3Quran (direct MP3)
            audioSources.push({ type: 'direct', url: `https://server12.mp3quran.net/${reciter.mp3quran}/mp3/${surahStr}.mp3` });
            // Quran.com API (needs parsing)
            audioSources.push({ type: 'api', url: `https://api.quran.com/api/v4/recitations/${reciter.quranapi}/by_chapter/${currentVerse.surah}` });
        } else {
            // Specific ayah
            const ayah = Array.isArray(currentVerse.ayah) ? currentVerse.ayah[0] : currentVerse.ayah;
            const ayahStr = String(ayah).padStart(3, '0');
            
            // AlQuran Cloud API (most reliable API - try first)
            // Use quranapi identifier which contains the AlQuran Cloud edition ID (e.g., ar.alafasy)
            if (reciter.quranapi) {
                audioSources.push({ type: 'api', url: `https://api.alquran.cloud/v1/ayah/${currentVerse.surah}:${ayah}/${reciter.quranapi}` });
            }
            // EveryAyah (reliable direct MP3 for individual ayahs)
            audioSources.push({ type: 'direct', url: `https://everyayah.com/data/${reciter.everyayah}/mp3/${surahStr}${ayahStr}.mp3` });
            // Alternative EveryAyah format
            audioSources.push({ type: 'direct', url: `https://everyayah.com/data/${reciter.everyayah}/mp3/${currentVerse.surah}${ayah}.mp3` });
            // Quran.com CDN (direct MP3)
            audioSources.push({ type: 'direct', url: `https://cdn.islamic.network/quran/audio/128/${reciter.qurancom}/${surahStr}${ayahStr}.mp3` });
            // MP3Quran (direct MP3)
            audioSources.push({ type: 'direct', url: `https://server12.mp3quran.net/${reciter.mp3quran}/mp3/${surahStr}${ayahStr}.mp3` });
            // Alternative MP3Quran format
            audioSources.push({ type: 'direct', url: `https://www.mp3quran.net/${reciter.mp3quran}/${surahStr}${ayahStr}.mp3` });
        }

        // Try each source until one works
        let sourceIndex = 0;
        
        const tryNextSource = async () => {
            if (sourceIndex >= audioSources.length) {
                // All sources failed - use TTS
                playBtn.disabled = false;
                playBtn.innerHTML = '<span class="icon">🔊</span> Play Reference Audio';
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(currentVerse.arabic);
                    utterance.lang = 'ar-SA';
                    utterance.rate = 0.8;
                    speechSynthesis.speak(utterance);
                } else {
                    alert('Could not load audio from any source. Please check your internet connection.');
                }
                return;
            }

            const audioSource = audioSources[sourceIndex];
            let audioUrl = audioSource.url;
            
            // If it's an API URL, fetch the audio URL first
            if (audioSource.type === 'api') {
                try {
                    const response = await fetch(audioUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        console.log('API response structure:', JSON.stringify(data, null, 2).substring(0, 1000));
                        
                        // AlQuran Cloud API format (https://alquran.cloud/api)
                        // For audio editions, the response structure is:
                        // { code: 200, status: "OK", data: { number, text, audio, audioSecondary, edition, ... } }
                        if (data.data) {
                            // Check for AlQuran Cloud audio format first
                            if (data.data.audio) {
                                audioUrl = data.data.audio;
                            } else if (data.data.audioSecondary && Array.isArray(data.data.audioSecondary) && data.data.audioSecondary.length > 0) {
                                audioUrl = data.data.audioSecondary[0];
                            } else if (data.data.ayahs && Array.isArray(data.data.ayahs) && data.data.ayahs.length > 0) {
                                // Alternative format with ayahs array
                                const ayahData = data.data.ayahs[0];
                                if (ayahData.audio) {
                                    audioUrl = ayahData.audio;
                                } else if (ayahData.audioSecondary && Array.isArray(ayahData.audioSecondary) && ayahData.audioSecondary.length > 0) {
                                    audioUrl = ayahData.audioSecondary[0];
                                }
                            }
                        }
                        
                        // Fallback to other API formats
                        if (!audioUrl) {
                            if (data.audio_file && data.audio_file.url) {
                                audioUrl = data.audio_file.url;
                            } else if (data.audio && data.audio.url) {
                                audioUrl = data.audio.url;
                            } else if (data.recitation && data.recitation.audio_url) {
                                audioUrl = data.recitation.audio_url;
                            } else if (data.url) {
                                audioUrl = data.url;
                            }
                        }
                        
                        if (audioUrl) {
                            console.log(`✓ Extracted audio URL from API: ${audioUrl}`);
                        } else {
                            console.log('Could not extract audio URL from API response. Data keys:', Object.keys(data));
                            if (data.data) {
                                console.log('data.data keys:', Object.keys(data.data));
                                if (data.data.ayahs && data.data.ayahs[0]) {
                                    console.log('ayahs[0] keys:', Object.keys(data.data.ayahs[0]));
                                }
                            }
                            sourceIndex++;
                            tryNextSource();
                            return;
                        }
                    } else {
                        console.log(`API returned ${response.status}, trying next source...`);
                        sourceIndex++;
                        tryNextSource();
                        return;
                    }
                } catch (e) {
                    console.log('API fetch failed:', e);
                    sourceIndex++;
                    tryNextSource();
                    return;
                }
            }

            // Try loading the audio
            console.log(`Trying audio source ${sourceIndex + 1}: ${audioUrl}`);
            audioElement.src = audioUrl;
            audioElement.style.display = 'block';
            audioElement.preload = 'auto';
            
            // Remove previous event listeners to avoid conflicts
            audioElement.onloadeddata = null;
            audioElement.onerror = null;
            audioElement.oncanplay = null;
            
            let loaded = false;
            let timeoutId;
            
            audioElement.oncanplay = () => {
                if (!loaded) {
                    loaded = true;
                    clearTimeout(timeoutId);
                    console.log(`✓ Audio loaded successfully from source ${sourceIndex + 1}`);
                    playBtn.disabled = false;
                    playBtn.innerHTML = '<span class="icon">🔊</span> Play Reference Audio';
                    audioElement.play().catch(err => {
                        console.error('Play error:', err);
                        // Try next source if play fails
                        sourceIndex++;
                        tryNextSource();
                    });
                }
            };
            
            audioElement.onerror = (e) => {
                if (!loaded) {
                    clearTimeout(timeoutId);
                    console.log(`✗ Audio source ${sourceIndex + 1} failed, trying next...`);
                    sourceIndex++;
                    tryNextSource();
                }
            };

            // Set a timeout to try next source if loading takes too long
            timeoutId = setTimeout(() => {
                if (!loaded && audioElement.readyState < 2) {
                    console.log(`Audio source ${sourceIndex + 1} timeout, trying next...`);
                    audioElement.onerror();
                }
            }, 8000); // Increased timeout to 8 seconds
        };

        tryNextSource();

    } catch (error) {
        console.error('Error loading audio:', error);
        playBtn.disabled = false;
        playBtn.innerHTML = '<span class="icon">🔊</span> Play Reference Audio';
        alert('Could not load audio. Using text-to-speech instead.');
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(currentVerse.arabic);
            utterance.lang = 'ar-SA';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }
    }
}

// Qeerat Section
function initializeQeeratSection() {
    const qeeratSelect = document.getElementById('qeerat-select');
    const qeeratReciterSelect = document.getElementById('qeerat-reciter-select');
    const askTutorBtn = document.getElementById('ask-tutor');
    const tutorInput = document.getElementById('tutor-input');

    qeeratSelect.addEventListener('change', (e) => {
        const qeeratKey = e.target.value;
        if (qeeratKey) {
            loadQeeratInfo(qeeratKey);
        }
    });

    qeeratReciterSelect.addEventListener('change', (e) => {
        currentQeeratReciter = e.target.value;
    });

    askTutorBtn.addEventListener('click', askTutor);
    tutorInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            askTutor();
        }
    });
}

function loadQeeratInfo(qeeratKey) {
    currentQeerat = qeeratInfo[qeeratKey];
    if (!currentQeerat) return;

    document.getElementById('qeerat-name').textContent = currentQeerat.name;
    document.getElementById('qeerat-description').textContent = currentQeerat.description;
    
    const differencesEl = document.getElementById('qeerat-differences');
    differencesEl.innerHTML = '<h4>Key Characteristics:</h4>' +
        currentQeerat.differences.map(diff => 
            `<div class="rule-item">${diff}</div>`
        ).join('');

    document.getElementById('selected-qeerat-name').textContent = currentQeerat.name;
    document.getElementById('selected-qeerat-text').textContent = currentQeerat.example;
    document.getElementById('play-selected-qeerat').disabled = false;

    // Populate reciter selector for this qira'ah
    const reciterSelect = document.getElementById('qeerat-reciter-select');
    const reciterSelectorDiv = document.getElementById('qeerat-reciter-selector');
    
    // Show note if available
    if (currentQeerat.note) {
        const noteEl = document.createElement('div');
        noteEl.className = 'qeerat-note';
        noteEl.style.cssText = 'background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 1rem; margin: 1rem 0; color: #856404;';
        noteEl.textContent = currentQeerat.note;
        
        // Remove existing note if any
        const existingNote = differencesEl.querySelector('.qeerat-note');
        if (existingNote) {
            existingNote.remove();
        }
        differencesEl.appendChild(noteEl);
    }
    
    if (currentQeerat.reciters && currentQeerat.reciters.length > 0) {
        reciterSelect.innerHTML = '';
        currentQeerat.reciters.forEach(reciterKey => {
            const reciter = reciters[reciterKey];
            if (reciter) {
                const option = document.createElement('option');
                option.value = reciterKey;
                option.textContent = reciter.name;
                reciterSelect.appendChild(option);
            }
        });
        
        // Set default reciter
        if (currentQeerat.defaultReciter) {
            reciterSelect.value = currentQeerat.defaultReciter;
            currentQeeratReciter = currentQeerat.defaultReciter;
        } else if (currentQeerat.reciters.length > 0) {
            reciterSelect.value = currentQeerat.reciters[0];
            currentQeeratReciter = currentQeerat.reciters[0];
        }
        
        reciterSelectorDiv.style.display = 'block';
        document.getElementById('play-selected-qeerat').disabled = false;
    } else {
        reciterSelectorDiv.style.display = 'none';
        document.getElementById('play-selected-qeerat').disabled = true;
        currentQeeratReciter = null;
    }
}

async function playAudio(type) {
    let text = '';
    let surah = 1;
    let ayah = 1;
    
    if (type === 'hafs') {
        text = verses.bismillah.arabic;
        surah = verses.bismillah.surah;
        ayah = verses.bismillah.ayah;
    } else if (type === 'selected' && currentQeerat) {
        text = currentQeerat.example;
        // Use Bismillah as default for comparison
        surah = 1;
        ayah = 1;
    }

    if (!text) return;

    // Try to play audio using the same multi-source approach as playReferenceAudio
    if ((type === 'selected' && currentQeerat && currentQeeratReciter) || (type === 'hafs' && currentReciter)) {
        const reciterKey = type === 'selected' ? currentQeeratReciter : currentReciter;
        const reciter = reciters[reciterKey];
        
        if (!reciter) {
            playTTS(text);
            return;
        }

        const audioElement = document.createElement('audio');
        const surahStr = String(surah).padStart(3, '0');
        const ayahStr = String(ayah).padStart(3, '0');
        
        // Build audio sources list (same approach as playReferenceAudio)
        const audioSources = [];
        
        // AlQuran Cloud API (try first for qira'at-specific recitations)
        if (reciter.quranapi) {
            audioSources.push({ type: 'api', url: `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/${reciter.quranapi}` });
        }
        
        // EveryAyah (direct MP3)
        if (reciter.everyayah) {
            audioSources.push({ type: 'direct', url: `https://everyayah.com/data/${reciter.everyayah}/mp3/${surahStr}${ayahStr}.mp3` });
            audioSources.push({ type: 'direct', url: `https://everyayah.com/data/${reciter.everyayah}/mp3/${surah}${ayah}.mp3` });
        }
        
        // Quran.com CDN (direct MP3)
        if (reciter.qurancom) {
            audioSources.push({ type: 'direct', url: `https://cdn.islamic.network/quran/audio/128/${reciter.qurancom}/${surahStr}${ayahStr}.mp3` });
        }
        
        // MP3Quran (direct MP3)
        if (reciter.mp3quran) {
            audioSources.push({ type: 'direct', url: `https://server12.mp3quran.net/${reciter.mp3quran}/mp3/${surahStr}${ayahStr}.mp3` });
            audioSources.push({ type: 'direct', url: `https://www.mp3quran.net/${reciter.mp3quran}/${surahStr}${ayahStr}.mp3` });
        }

        if (audioSources.length === 0) {
            playTTS(text);
            return;
        }

        // Try each source until one works
        let sourceIndex = 0;
        const tryNextSource = async () => {
            if (sourceIndex >= audioSources.length) {
                // All sources failed - use TTS
                playTTS(text);
                return;
            }

            const source = audioSources[sourceIndex];
            let audioUrl = source.url;

            // Handle API sources
            if (source.type === 'api') {
                try {
                    const response = await fetch(source.url, {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.data && data.data.audio) {
                            audioUrl = data.data.audio;
                        } else if (data.data && data.data.audioSecondary && Array.isArray(data.data.audioSecondary) && data.data.audioSecondary.length > 0) {
                            audioUrl = data.data.audioSecondary[0];
                        } else {
                            sourceIndex++;
                            tryNextSource();
                            return;
                        }
                    } else {
                        sourceIndex++;
                        tryNextSource();
                        return;
                    }
                } catch (e) {
                    sourceIndex++;
                    tryNextSource();
                    return;
                }
            }

            // Try loading the audio
            console.log(`Trying audio source ${sourceIndex + 1}: ${audioUrl}`);
            audioElement.src = audioUrl;
            
            let loaded = false;
            let timeoutId;
            
            audioElement.oncanplay = () => {
                if (!loaded) {
                    loaded = true;
                    clearTimeout(timeoutId);
                    console.log(`✓ Audio loaded successfully from source ${sourceIndex + 1}`);
                    audioElement.play().catch(err => {
                        console.error('Play error:', err);
                        sourceIndex++;
                        tryNextSource();
                    });
                }
            };
            
            audioElement.onerror = () => {
                if (!loaded) {
                    clearTimeout(timeoutId);
                    console.log(`✗ Audio source ${sourceIndex + 1} failed, trying next...`);
                    sourceIndex++;
                    tryNextSource();
                }
            };

            timeoutId = setTimeout(() => {
                if (!loaded && audioElement.readyState < 2) {
                    console.log(`Audio source ${sourceIndex + 1} timeout, trying next...`);
                    audioElement.onerror();
                }
            }, 8000);
        };

        tryNextSource();
        return;
    }

    // Fallback to text-to-speech
    playTTS(text);
}

function playTTS(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    }
}

// AI Tutor for Qeerat
async function askTutor() {
    const input = document.getElementById('tutor-input');
    const question = input.value.trim();
    
    if (!question) return;
    if (!GEMINI_API_KEY && !OAUTH_ACCESS_TOKEN) {
        alert('Please configure your Gemini API key or sign in with OAuth first.');
        return;
    }

    // Check rate limiting
    const timeSinceLastCall = Date.now() - lastApiCallTime;
    if (timeSinceLastCall < MIN_TIME_BETWEEN_CALLS) {
        const waitTime = MIN_TIME_BETWEEN_CALLS - timeSinceLastCall;
        alert(`Please wait ${Math.ceil(waitTime / 1000)} seconds before asking another question to avoid overloading the API.`);
        return;
    }

    const messagesEl = document.getElementById('tutor-messages');
    
    // Add user message
    messagesEl.innerHTML += `
        <div class="message user">
            <p>${question}</p>
        </div>
    `;
    messagesEl.scrollTop = messagesEl.scrollHeight;
    input.value = '';

    // Add loading message
    const loadingId = 'loading-' + Date.now();
    messagesEl.innerHTML += `
        <div class="message ai" id="${loadingId}">
            <p>Thinking...</p>
        </div>
    `;
    messagesEl.scrollTop = messagesEl.scrollHeight;

    const context = currentQeerat 
        ? `Current qeerat being discussed: ${currentQeerat.name} - ${currentQeerat.description}`
        : 'General discussion about qira\'at (Quranic recitation styles)';

    // Optimized shorter prompt for faster responses
    const prompt = `Qira'at expert. ${context}

Question: "${question}"

Answer concisely about qira'at: history, pronunciation differences, comparisons, examples. Be clear and educational.`;

    // Use rate-limited API call
    await makeRateLimitedApiCall(async () => {
        await performTutorApiCall(prompt, loadingId, messagesEl);
    });
}

// Perform tutor API call
async function performTutorApiCall(prompt, loadingId, messagesEl) {

    // Try fastest models first for quick responses
    // Flash models are much faster and less likely to be overloaded
    // Only use models that are actually available (based on API response)
    const apiConfigs = [
        { version: 'v1beta', model: 'gemini-2.5-flash' },
        { version: 'v1beta', model: 'gemini-2.5-flash-preview-05-20' },
        { version: 'v1beta', model: 'gemini-flash-latest' },
        { version: 'v1beta', model: 'gemini-2.5-flash-lite' },
        { version: 'v1beta', model: 'gemini-2.0-flash' },
        { version: 'v1beta', model: 'gemini-2.0-flash-001' },
        // Pro models as last resort (often overloaded)
        { version: 'v1beta', model: 'gemini-2.5-pro' },
        { version: 'v1beta', model: 'gemini-2.5-pro-preview-06-05' },
        { version: 'v1beta', model: 'gemini-2.5-pro-preview-05-06' },
        { version: 'v1beta', model: 'gemini-pro-latest' },
        { version: 'v1', model: 'gemini-pro' }
    ];

    let lastError = null;
    for (const config of apiConfigs) {
        try {
            const apiUrl = getApiUrl(config.version, config.model);
            if (!apiUrl) {
                lastError = new Error('No authentication method available');
                continue;
            }
            
            const headers = {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            };
            
            // Add timeout and optimize request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.8,
                        topK: 40,
                        maxOutputTokens: 500 // Limit response length for speed
                    }
                })
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `API error: ${response.status}`;
                let errorDetails = null;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error?.message || errorMessage;
                    errorDetails = errorData.error;
                    console.error(`API Error for ${config.version}/${config.model}:`, errorDetails);
                    // Log full error for debugging
                    if (response.status === 400) {
                        console.error('Full 400 error response:', errorData);
                    }
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                    console.error('Error parsing error response:', e, errorText);
                }
                lastError = new Error(errorMessage);
                // Handle different error types
                if (response.status === 400) {
                    console.warn(`Model ${config.model} returned 400 - trying next model...`);
                } else if (response.status === 503) {
                    console.warn(`Model ${config.model} is overloaded (503) - trying next model...`);
                    // Small delay before trying next model to avoid hammering the API
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else if (response.status === 429) {
                    console.warn(`Model ${config.model} rate limited (429) - trying next model...`);
                    // Longer delay for rate limits
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                continue; // Try next configuration
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                lastError = new Error('Unexpected API response format');
                continue;
            }
            
            const answer = data.candidates[0].content.parts[0].text;
            console.log(`✓ Tutor success with ${config.model}!`);

            // Replace loading message with answer
            document.getElementById(loadingId).innerHTML = `<p>${answer}</p>`;
            messagesEl.scrollTop = messagesEl.scrollHeight;
            return; // Success!
        } catch (error) {
            if (error.name === 'AbortError') {
                lastError = new Error('Request timeout - model took too long to respond');
                console.warn(`Timeout for ${config.model}, trying next model...`);
            } else {
                lastError = error;
            }
            continue; // Try next configuration
        }
    }

    // If all configurations failed
    console.error('Error calling Gemini API:', lastError);
    const errorMsg = lastError?.message || 'All API configurations failed';
    document.getElementById(loadingId).innerHTML = `
        <p><strong>Error:</strong> Could not get response from AI tutor.</p>
        <p><small>Error: ${errorMsg}</small></p>
        <p><small>Please check your API key permissions and ensure billing is enabled in Google Cloud.</small></p>
    `;
}

// Settings functionality
function initializeSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const apiKeyInput = document.getElementById('api-key-input');

    // Open settings modal
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'block';
        // Load current API key (masked) into input
        if (GEMINI_API_KEY) {
            apiKeyInput.value = GEMINI_API_KEY.substring(0, 8) + '...' + GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4);
        } else {
            apiKeyInput.value = '';
        }
        updateAPIKeyStatus();
    });

    // Close settings modal
    closeSettings.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    // Save API key
    saveApiKeyBtn.addEventListener('click', () => {
        const newKey = apiKeyInput.value.trim();
        if (newKey && newKey.length > 20) {
            // If it's a masked key (contains ...), don't update
            if (newKey.includes('...')) {
                alert('Please enter a new API key. The current key is masked for security.');
                return;
            }
            GEMINI_API_KEY = newKey;
            localStorage.setItem('gemini_api_key', GEMINI_API_KEY);
            updateAPIKeyStatus();
            alert('API key saved successfully!');
            settingsModal.style.display = 'none';
        } else {
            alert('Please enter a valid API key.');
        }
    });

    // Allow Enter key to save
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveApiKeyBtn.click();
        }
    });
}

function updateAPIKeyStatus() {
    const statusEl = document.getElementById('api-key-status');
    if (OAUTH_ACCESS_TOKEN) {
        statusEl.textContent = '✓ OAuth Authenticated';
        statusEl.className = 'configured';
    } else if (GEMINI_API_KEY && GEMINI_API_KEY.length > 0) {
        statusEl.textContent = '✓ API Key Configured';
        statusEl.className = 'configured';
    } else {
        statusEl.textContent = 'Not configured (OAuth or API Key needed)';
        statusEl.className = '';
    }
}

// Make playAudio available globally
window.playAudio = playAudio;

