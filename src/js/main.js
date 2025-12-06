/**
 * Main Entry Point
 * Initializes and coordinates all modules
 */

import { 
    inputArea, outputArea, decompressBtn, clearBtn, copyBtn 
} from './modules/dom.js';
import { originalJsonString, setOriginalJsonString, resetSearchState } from './modules/state.js';
import { processGzip } from './modules/gzip-processor.js';
import { showStatus, showToast } from './modules/ui-helpers.js';
import { initTheme } from './modules/theme.js';
import { initResizer } from './modules/resizer.js';
import { initSearch, clearSearch } from './modules/search.js';
import { searchBtn, searchBar } from './modules/dom.js';

/**
 * Initialize the application
 */
function init() {
    // Initialize modules
    initTheme();
    initResizer();
    initSearch();

    // Setup event listeners
    setupEventListeners();

    // Show initial status
    showStatus('info', 'Sẵn sàng', 'Vui lòng nhập chuỗi Base64 GZIP vào ô bên trái.');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Decompress button
    decompressBtn.addEventListener('click', () => {
        processGzip(inputArea.value);
    });

    // Auto-process on input
    inputArea.addEventListener('input', () => {
        processGzip(inputArea.value);
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
        inputArea.value = '';
        outputArea.innerHTML = '';
        setOriginalJsonString('');
        copyBtn.classList.add('invisible');
        searchBtn.classList.add('invisible');
        searchBar.classList.add('hidden');
        clearSearch();
        resetSearchState();
        inputArea.focus();
        showStatus('info', 'Sẵn sàng', 'Vui lòng nhập chuỗi Base64 GZIP vào ô bên trái.');
    });

    // Copy button
    copyBtn.addEventListener('click', () => {
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
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
