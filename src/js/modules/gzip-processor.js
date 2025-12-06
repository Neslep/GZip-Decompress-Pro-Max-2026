/**
 * GZIP Processor Module
 * Handles GZIP decompression and processing
 */

import { renderJson } from './json-renderer.js';
import { setOriginalJsonString } from './state.js';
import { outputArea, copyBtn, searchBtn, searchBar } from './dom.js';
import { showStatus, hideStatus, showToast } from './ui-helpers.js';
import { clearSearch } from './search.js';

/**
 * Parse error message to user-friendly format
 * @param {Error} err - Error object
 * @returns {string} - User-friendly error message
 */
function parseErrorMessage(err) {
    if (err.message && err.message.includes('incorrect header check')) {
        return 'Chuỗi nhập vào có thể không phải định dạng GZIP hoặc đã bị hỏng.';
    }
    if (err.name === 'InvalidCharacterError' || err.message.includes('atob')) {
        return 'Chuỗi nhập vào không phải là Base64 hợp lệ.';
    }
    return err.message || 'Lỗi không xác định.';
}

/**
 * Process GZIP compressed Base64 string
 * @param {string} rawInput - Base64 encoded GZIP string
 */
export function processGzip(rawInput) {
    const input = rawInput.trim();
    
    // Reset UI
    hideStatus();
    outputArea.innerHTML = '';
    setOriginalJsonString('');
    copyBtn.classList.add('invisible');
    searchBtn.classList.add('invisible');
    searchBar.classList.add('hidden');
    clearSearch();

    if (!input) {
        showStatus('info', 'Chờ dữ liệu', 'Vui lòng nhập chuỗi Base64 GZIP vào ô bên trái.');
        return;
    }

    try {
        // 1. Decode Base64
        const binaryString = atob(input);
        const charData = binaryString.split('').map(x => x.charCodeAt(0));
        const byteArray = new Uint8Array(charData);

        // 2. Decompress GZIP using Pako
        const decompressedData = pako.ungzip(byteArray, { to: 'string' });

        // 3. Parse JSON và Format
        try {
            const jsonObject = JSON.parse(decompressedData);
            const formattedJson = JSON.stringify(jsonObject, null, 4);

            // Save original JSON string for copying
            setOriginalJsonString(formattedJson);
            renderJson(formattedJson);

            copyBtn.classList.remove('invisible');
            searchBtn.classList.remove('invisible');
            showToast('success', 'Giải nén thành công!');
        } catch (jsonError) {
            // Nếu không phải JSON, hiển thị text thuần
            setOriginalJsonString(decompressedData);
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
