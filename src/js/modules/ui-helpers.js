/**
 * UI Helpers Module
 * Provides utility functions for UI interactions
 */

import { statusMessage, statusText, statusDetail, statusIcon, toast, toastMsg, toastIcon } from './dom.js';

/**
 * Show status message
 * @param {string} type - Status type: 'error', 'info', 'warning'
 * @param {string} title - Status title
 * @param {string} detail - Status detail message
 */
export function showStatus(type, title, detail) {
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

/**
 * Hide status message
 */
export function hideStatus() {
    statusMessage.classList.add('hidden');
}

/**
 * Show toast notification
 * @param {string} type - Toast type: 'success', 'warning'
 * @param {string} msg - Toast message
 */
export function showToast(type, msg) {
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
