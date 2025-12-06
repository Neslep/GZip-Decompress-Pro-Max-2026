const inputArea = document.getElementById('inputArea');
const outputArea = document.getElementById('outputArea');
const decompressBtn = document.getElementById('decompressBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const statusMessage = document.getElementById('statusMessage');
const statusText = document.getElementById('statusText');
const statusDetail = document.getElementById('statusDetail');
const statusIcon = document.getElementById('statusIcon');

let lineMeta = []; // Store metadata for each line

function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\u[a-zA-Z0-9]{4}|\[^u]|[^\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'text-emerald-400';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'text-sky-400';
            } else {
                cls = 'text-amber-300';
            }
        } else if (/true|false/.test(match)) {
            cls = 'text-blue-400';
        } else if (/null/.test(match)) {
            cls = 'text-rose-400';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function renderJson(jsonString) {
    outputArea.innerHTML = '';
    const lines = jsonString.split('\n');
    lineMeta = new Array(lines.length);
    
    // 1. Analyze structure (Parent/Child relationships)
    const stack = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parent = stack.length > 0 ? stack[stack.length - 1] : -1;
        
        lineMeta[i] = { 
            parent: parent, 
            collapsed: false,
            element: null,
            foldBtn: null,
            indicator: null
        };

        // Check for closing block
        if (/^\s*[}\]]/.test(line)) {
            if (stack.length > 0) {
                lineMeta[i].parent = stack[stack.length - 1];
                stack.pop();
            }
        }

        // Check for opening block
        if (/[{\[]\s*,?$/.test(line)) {
            stack.push(i);
            lineMeta[i].isStart = true;
        }
    }

    // 2. Render DOM
    const fragment = document.createDocumentFragment();
    
    lines.forEach((line, i) => {
        const row = document.createElement('div');
        row.className = 'line-row';
        row.id = `line-${i}`;
        lineMeta[i].element = row;

        // Line Number
        const num = document.createElement('div');
        num.className = 'line-num';
        num.textContent = i + 1;
        row.appendChild(num);

        // Fold Gutter
        const gutter = document.createElement('div');
        gutter.className = 'fold-gutter';
        if (lineMeta[i].isStart) {
            const icon = document.createElement('div');
            icon.className = 'fold-icon';
            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>`;
            icon.onclick = (e) => {
                e.stopPropagation();
                toggleFold(i);
            };
            gutter.appendChild(icon);
            lineMeta[i].foldBtn = icon;
        }
        row.appendChild(gutter);

        // Content
        const content = document.createElement('div');
        content.className = 'code-content';
        content.innerHTML = syntaxHighlight(line);
        
        // Collapsed Indicator (...)
        if (lineMeta[i].isStart) {
            const indicator = document.createElement('span');
            indicator.className = 'collapsed-indicator hidden';
            indicator.textContent = '...';
            indicator.onclick = (e) => {
                e.stopPropagation();
                toggleFold(i);
            };
            content.appendChild(indicator);
            lineMeta[i].indicator = indicator;
        }

        row.appendChild(content);
        fragment.appendChild(row);
    });

    outputArea.appendChild(fragment);
}

function toggleFold(index) {
    const meta = lineMeta[index];
    meta.collapsed = !meta.collapsed;

    // Update UI for the toggle button
    if (meta.foldBtn) {
        meta.foldBtn.classList.toggle('collapsed', meta.collapsed);
    }
    if (meta.indicator) {
        meta.indicator.classList.toggle('hidden', !meta.collapsed);
    }

    for (let i = index + 1; i < lineMeta.length; i++) {
        const line = lineMeta[i];
        
        // Check if this line is a descendant of the toggled block
        let p = line.parent;
        let isDescendant = false;
        while (p !== -1) {
            if (p === index) {
                isDescendant = true;
                break;
            }
            p = lineMeta[p].parent;
        }

        if (!isDescendant) {
            continue; 
        }

        // Determine visibility
        let visible = true;
        let curr = line.parent;
        while (curr !== -1) {
            if (lineMeta[curr].collapsed) {
                visible = false;
                break;
            }
            curr = lineMeta[curr].parent;
        }

        line.element.style.display = visible ? 'flex' : 'none';
    }
}

// Hàm xử lý chính
function processGzip() {
    const rawInput = inputArea.value.trim();
    
    // Reset UI
    hideStatus();
    outputArea.innerHTML = '';
    copyBtn.classList.add('hidden');

    if (!rawInput) {
        showStatus('info', 'Chờ dữ liệu', 'Vui lòng nhập chuỗi Base64 GZIP vào ô bên trái.');
        return;
    }

    try {
        // 1. Decode Base64
        const binaryString = atob(rawInput);
        const charData = binaryString.split('').map(x => x.charCodeAt(0));
        const byteArray = new Uint8Array(charData);

        // 2. Decompress GZIP using Pako
        const decompressedData = pako.ungzip(byteArray, { to: 'string' });

        // 3. Parse JSON và Format
        try {
            const jsonObject = JSON.parse(decompressedData);
            const formattedJson = JSON.stringify(jsonObject, null, 4);
            
            renderJson(formattedJson);
            
            copyBtn.classList.remove('hidden');
            showToast('success', 'Giải nén thành công!');
        } catch (jsonError) {
            // Nếu không phải JSON, hiển thị text thuần
            outputArea.textContent = decompressedData;
            outputArea.className = 'code-font text-sm text-gray-300 whitespace-pre p-4';
            copyBtn.classList.remove('hidden');
            showToast('warning', 'Đã giải nén (Không phải JSON)');
        }

    } catch (err) {
        console.error(err);
        showStatus('error', 'Lỗi xử lý', parseErrorMessage(err));
    }
}

function parseErrorMessage(err) {
    if (err.message && err.message.includes('incorrect header check')) {
        return 'Chuỗi nhập vào có thể không phải định dạng GZIP hoặc đã bị hỏng.';
    }
    if (err.name === 'InvalidCharacterError' || err.message.includes('atob')) {
        return 'Chuỗi nhập vào không phải là Base64 hợp lệ.';
    }
    return err.message || 'Lỗi không xác định.';
}

// --- UI Helper Functions ---

function showStatus(type, title, detail) {
    statusMessage.classList.remove('hidden');
    statusText.textContent = title;
    statusDetail.textContent = detail;
    
    let iconSvg = '';
    let colorClass = '';

    if (type === 'error') {
        colorClass = 'text-red-500';
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    } else {
        colorClass = 'text-blue-500';
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    }

    statusText.className = `text-lg font-bold ${colorClass}`;
    statusIcon.innerHTML = `<div class="${colorClass}">${iconSvg}</div>`;
}

function hideStatus() {
    statusMessage.classList.add('hidden');
}

function showToast(type, msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const toastIcon = document.getElementById('toastIcon');

    toastMsg.innerText = msg;
    
    if (type === 'success') {
        toastIcon.innerHTML = `<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    } else if (type === 'warning') {
        toastIcon.innerHTML = `<svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// --- Event Listeners ---

decompressBtn.addEventListener('click', processGzip);
inputArea.addEventListener('input', processGzip);

clearBtn.addEventListener('click', () => {
    inputArea.value = '';
    outputArea.innerHTML = '';
    copyBtn.classList.add('hidden');
    inputArea.focus();
    showStatus('info', 'Sẵn sàng', 'Vui lòng nhập chuỗi Base64 GZIP vào ô bên trái.');
});

copyBtn.addEventListener('click', () => {
    const text = outputArea.innerText; // Use innerText to get text content
    if (!text) return;
    
    // Fallback copy method
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showToast('success', 'Đã sao chép vào Clipboard');
    } catch (err) {
        showToast('warning', 'Không thể sao chép');
    }
    document.body.removeChild(textArea);
});

// Initialize state
showStatus('info', 'Sẵn sàng', 'Vui lòng nhập chuỗi Base64 GZIP vào ô bên trái.');

// --- Resizer Logic ---
const resizer = document.getElementById('resizer');
const inputSection = document.getElementById('inputSection');
const mainContainer = document.getElementById('mainContainer');

let isResizing = false;

resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = window.innerWidth >= 768 ? 'col-resize' : 'row-resize';
    resizer.classList.add('bg-blue-500');
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const containerRect = mainContainer.getBoundingClientRect();
    const isDesktop = window.innerWidth >= 768;

    if (isDesktop) {
        // Calculate percentage width
        let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        // Constraints (min 10%, max 90%)
        newWidth = Math.max(10, Math.min(90, newWidth));
        
        inputSection.style.flex = `0 0 ${newWidth}%`;
    } else {
        // Calculate percentage height
        let newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;
        // Constraints
        newHeight = Math.max(10, Math.min(90, newHeight));
        
        inputSection.style.flex = `0 0 ${newHeight}%`;
    }
});

document.addEventListener('mouseup', () => {
    if (isResizing) {
        isResizing = false;
        document.body.style.removeProperty('user-select');
        document.body.style.removeProperty('cursor');
        resizer.classList.remove('bg-blue-500');
    }
});

// --- Theme Management ---
const THEME_STORAGE_KEY = 'gzip-converter-theme';
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};

const themeToggleBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

// Icons for each theme
const THEME_ICONS = {
    light: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>`,
    dark: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>`,
    system: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>`
};

let currentThemePreference = THEMES.SYSTEM;

// Get system theme preference
function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
}

// Apply theme to document
function applyTheme(theme) {
    const actualTheme = theme === THEMES.SYSTEM ? getSystemTheme() : theme;

    if (actualTheme === THEMES.LIGHT) {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }

    updateThemeIcon(theme);
}

// Update theme icon
function updateThemeIcon(theme) {
    themeIcon.innerHTML = THEME_ICONS[theme];

    const themeNames = {
        light: 'Light Mode',
        dark: 'Dark Mode',
        system: 'System Theme'
    };
    themeToggleBtn.setAttribute('title', themeNames[theme]);
}

// Get next theme in cycle
function getNextTheme(current) {
    const cycle = [THEMES.LIGHT, THEMES.DARK, THEMES.SYSTEM];
    const currentIndex = cycle.indexOf(current);
    return cycle[(currentIndex + 1) % cycle.length];
}

// Toggle theme
function toggleTheme() {
    currentThemePreference = getNextTheme(currentThemePreference);
    localStorage.setItem(THEME_STORAGE_KEY, currentThemePreference);
    applyTheme(currentThemePreference);
}

// Initialize theme
function initTheme() {
    // Load saved theme or default to system
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    currentThemePreference = savedTheme || THEMES.SYSTEM;
    applyTheme(currentThemePreference);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (currentThemePreference === THEMES.SYSTEM) {
            applyTheme(THEMES.SYSTEM);
        }
    });
}

// Event listener
themeToggleBtn.addEventListener('click', toggleTheme);

// Initialize theme on load
initTheme();