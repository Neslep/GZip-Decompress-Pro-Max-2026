const inputArea = document.getElementById('inputArea');
const outputArea = document.getElementById('outputArea');
const decompressBtn = document.getElementById('decompressBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const statusMessage = document.getElementById('statusMessage');
const statusText = document.getElementById('statusText');
const statusDetail = document.getElementById('statusDetail');
const statusIcon = document.getElementById('statusIcon');

// Search elements
const searchBtn = document.getElementById('searchBtn');
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
const searchMatchCount = document.getElementById('searchMatchCount');
const searchPrevBtn = document.getElementById('searchPrevBtn');
const searchNextBtn = document.getElementById('searchNextBtn');
const searchCloseBtn = document.getElementById('searchCloseBtn');
const searchCaseSensitive = document.getElementById('searchCaseSensitive');

let lineMeta = []; // Store metadata for each line
let originalJsonString = ''; // Store original JSON string for copying

// Search state
let searchMatches = [];
let currentMatchIndex = -1;
let originalContent = ''; // Store original HTML content before search

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
    originalJsonString = '';
    copyBtn.classList.add('invisible');
    searchBtn.classList.add('invisible');
    searchBar.classList.add('hidden');
    clearSearch();

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

            // Save original JSON string for copying
            originalJsonString = formattedJson;
            renderJson(formattedJson);

            copyBtn.classList.remove('invisible');
            searchBtn.classList.remove('invisible');
            showToast('success', 'Giải nén thành công!');
        } catch (jsonError) {
            // Nếu không phải JSON, hiển thị text thuần
            originalJsonString = decompressedData;
            outputArea.textContent = decompressedData;
            outputArea.className = 'code-font text-sm text-gray-300 whitespace-pre p-4';
            copyBtn.classList.remove('invisible');
            searchBtn.classList.remove('invisible');
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
    originalJsonString = '';
    copyBtn.classList.add('invisible');
    searchBtn.classList.add('invisible');
    searchBar.classList.add('hidden');
    clearSearch();
    inputArea.focus();
    showStatus('info', 'Sẵn sàng', 'Vui lòng nhập chuỗi Base64 GZIP vào ô bên trái.');
});

copyBtn.addEventListener('click', () => {
    // Use the original JSON string instead of innerText to avoid copying line numbers
    const text = originalJsonString;
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

const themeButtons = document.querySelectorAll('.theme-btn');
const themeIndicator = document.getElementById('themeIndicator');
const themeRipple = document.getElementById('themeRipple');

let currentThemePreference = THEMES.SYSTEM;

// Get system theme preference
function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
}

// Create ripple effect
function createRipple(event) {
    const rect = event.target.closest('.theme-btn').getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const ripple = document.createElement('div');
    ripple.className = 'ripple-circle';
    ripple.style.width = ripple.style.height = '100vh';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.transform = 'translate(-50%, -50%) scale(0)';

    // Determine ripple color based on target theme
    const targetTheme = event.target.closest('.theme-btn').dataset.theme;
    const actualTargetTheme = targetTheme === THEMES.SYSTEM ? getSystemTheme() : targetTheme;
    ripple.classList.add(actualTargetTheme === THEMES.LIGHT ? 'ripple-light' : 'ripple-dark');

    themeRipple.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
        ripple.remove();
    }, 1000);
}

// Update indicator position
function updateIndicator(theme) {
    const activeButton = document.querySelector(`.theme-btn[data-theme="${theme}"]`);
    if (activeButton) {
        const rect = activeButton.getBoundingClientRect();
        const parentRect = activeButton.parentElement.getBoundingClientRect();
        const left = rect.left - parentRect.left;

        themeIndicator.style.left = left + 'px';
        themeIndicator.style.width = rect.width + 'px';
    }

    // Update active states
    themeButtons.forEach(btn => {
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Apply theme to document
function applyTheme(theme, withRipple = false, event = null) {
    const actualTheme = theme === THEMES.SYSTEM ? getSystemTheme() : theme;

    if (actualTheme === THEMES.LIGHT) {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }

    updateIndicator(theme);

    if (withRipple && event) {
        createRipple(event);
    }
}

// Set theme
function setTheme(theme, event) {
    currentThemePreference = theme;
    localStorage.setItem(THEME_STORAGE_KEY, currentThemePreference);
    applyTheme(currentThemePreference, true, event);
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

// Event listeners for theme buttons
themeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const theme = btn.dataset.theme;
        setTheme(theme, e);
    });
});

// Initialize theme on load
initTheme();

// --- Search Functionality ---

function toggleSearch() {
    const isHidden = searchBar.classList.contains('hidden');

    if (isHidden) {
        // Show search bar
        searchBar.classList.remove('hidden');
        searchInput.focus();
        searchInput.select();
    } else {
        // Hide search bar
        searchBar.classList.add('hidden');
        clearSearch();
    }
}

function clearSearch() {
    searchInput.value = '';
    searchMatches = [];
    currentMatchIndex = -1;
    updateSearchHighlights();
    updateMatchCount();
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function performSearch() {
    const query = searchInput.value;

    if (!query) {
        clearSearch();
        return;
    }

    // Clear previous highlights
    searchMatches = [];
    currentMatchIndex = -1;

    // Get all text content nodes from outputArea
    const caseSensitive = searchCaseSensitive.checked;
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(escapeRegExp(query), flags);

    // Search in each line's code-content
    const codeContents = outputArea.querySelectorAll('.code-content');

    codeContents.forEach((content, lineIndex) => {
        const originalHTML = content.innerHTML;
        let textContent = content.textContent;

        // Find all matches
        let match;
        const tempMatches = [];
        while ((match = regex.exec(textContent)) !== null) {
            tempMatches.push({
                lineIndex,
                content,
                originalHTML,
                matchIndex: match.index,
                matchText: match[0]
            });
        }

        searchMatches.push(...tempMatches);
    });

    // Update highlights and navigate to first match
    if (searchMatches.length > 0) {
        currentMatchIndex = 0;
        updateSearchHighlights();
        scrollToCurrentMatch();
    }

    updateMatchCount();
}

function updateSearchHighlights() {
    // First, restore all original content by removing only search highlights
    const codeContents = outputArea.querySelectorAll('.code-content');
    codeContents.forEach(content => {
        // Remove all search highlights but preserve syntax highlighting
        const highlightedElements = content.querySelectorAll('.search-highlight, .search-highlight-current');
        highlightedElements.forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
        });
        // Normalize to merge adjacent text nodes
        content.normalize();
    });

    if (searchMatches.length === 0) return;

    const query = searchInput.value;
    const caseSensitive = searchCaseSensitive.checked;
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(escapeRegExp(query), flags);

    // Group matches by line
    const matchesByLine = {};
    searchMatches.forEach((match, index) => {
        if (!matchesByLine[match.lineIndex]) {
            matchesByLine[match.lineIndex] = [];
        }
        matchesByLine[match.lineIndex].push({ ...match, globalIndex: index });
    });

    // Apply highlights line by line, preserving syntax highlighting
    Object.entries(matchesByLine).forEach(([, matches]) => {
        const content = matches[0].content;
        highlightTextInElement(content, regex, matches);
    });
}

function highlightTextInElement(element, regex, matches) {
    const textContent = element.textContent;

    // Find all match positions in the text
    const matchPositions = [];
    let match;
    let matchCount = 0;
    while ((match = regex.exec(textContent)) !== null) {
        const globalIndex = matches[matchCount]?.globalIndex;
        matchPositions.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0],
            isCurrent: globalIndex === currentMatchIndex
        });
        matchCount++;
    }

    if (matchPositions.length === 0) return;

    // Walk through all text nodes and apply highlights
    let currentPos = 0;
    let matchIndex = 0;

    function walkNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const nodeLength = node.textContent.length;
            const nodeStart = currentPos;
            const nodeEnd = currentPos + nodeLength;

            // Check if any matches overlap with this text node
            const relevantMatches = [];
            while (matchIndex < matchPositions.length) {
                const m = matchPositions[matchIndex];
                if (m.start < nodeEnd && m.end > nodeStart) {
                    relevantMatches.push({
                        ...m,
                        localStart: Math.max(0, m.start - nodeStart),
                        localEnd: Math.min(nodeLength, m.end - nodeStart)
                    });
                    if (m.end <= nodeEnd) {
                        matchIndex++;
                    } else {
                        break;
                    }
                } else if (m.start >= nodeEnd) {
                    break;
                } else {
                    matchIndex++;
                }
            }

            if (relevantMatches.length > 0) {
                const parent = node.parentNode;
                const fragments = [];
                let lastIndex = 0;

                relevantMatches.forEach(m => {
                    // Add text before match
                    if (m.localStart > lastIndex) {
                        fragments.push(document.createTextNode(node.textContent.substring(lastIndex, m.localStart)));
                    }

                    // Add highlighted match
                    const span = document.createElement('span');
                    span.className = m.isCurrent ? 'search-highlight-current' : 'search-highlight';
                    span.textContent = node.textContent.substring(m.localStart, m.localEnd);
                    fragments.push(span);

                    lastIndex = m.localEnd;
                });

                // Add remaining text
                if (lastIndex < nodeLength) {
                    fragments.push(document.createTextNode(node.textContent.substring(lastIndex)));
                }

                // Replace the text node with fragments
                fragments.forEach(frag => parent.insertBefore(frag, node));
                parent.removeChild(node);
            }

            currentPos += nodeLength;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Process child nodes
            const children = Array.from(node.childNodes);
            children.forEach(child => walkNodes(child));
        }
    }

    walkNodes(element);
}

function scrollToCurrentMatch() {
    if (currentMatchIndex < 0 || currentMatchIndex >= searchMatches.length) return;

    const currentHighlight = outputArea.querySelector('.search-highlight-current');
    if (currentHighlight) {
        currentHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function navigateToNextMatch() {
    if (searchMatches.length === 0) return;

    currentMatchIndex = (currentMatchIndex + 1) % searchMatches.length;
    updateSearchHighlights();
    scrollToCurrentMatch();
    updateMatchCount();
}

function navigateToPrevMatch() {
    if (searchMatches.length === 0) return;

    currentMatchIndex = currentMatchIndex - 1;
    if (currentMatchIndex < 0) {
        currentMatchIndex = searchMatches.length - 1;
    }
    updateSearchHighlights();
    scrollToCurrentMatch();
    updateMatchCount();
}

function updateMatchCount() {
    if (searchMatches.length === 0) {
        searchMatchCount.textContent = '0/0';
        searchPrevBtn.disabled = true;
        searchNextBtn.disabled = true;
    } else {
        searchMatchCount.textContent = `${currentMatchIndex + 1}/${searchMatches.length}`;
        searchPrevBtn.disabled = false;
        searchNextBtn.disabled = false;
    }
}

// Search event listeners
searchBtn.addEventListener('click', toggleSearch);

searchCloseBtn.addEventListener('click', () => {
    searchBar.classList.add('hidden');
    clearSearch();
});

searchInput.addEventListener('input', performSearch);

searchCaseSensitive.addEventListener('change', performSearch);

searchNextBtn.addEventListener('click', navigateToNextMatch);

searchPrevBtn.addEventListener('click', navigateToPrevMatch);

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
            navigateToPrevMatch();
        } else {
            navigateToNextMatch();
        }
    } else if (e.key === 'Escape') {
        searchBar.classList.add('hidden');
        clearSearch();
    }
});

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+F or Cmd+F to open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();

        // Only open search if there's content in output
        if (originalJsonString) {
            toggleSearch();
        }
    }

    // Escape to close search
    if (e.key === 'Escape' && !searchBar.classList.contains('hidden')) {
        searchBar.classList.add('hidden');
        clearSearch();
    }
});