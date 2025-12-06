/**
 * Resizer Module
 * Handles panel resizing functionality
 */

import { resizer, inputSection, mainContainer } from './dom.js';

let isResizing = false;

/**
 * Initialize resizer functionality
 */
export function initResizer() {
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
}
