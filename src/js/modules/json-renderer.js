/**
 * JSON Renderer Module
 * Handles rendering JSON with collapsible sections
 */

import { syntaxHighlight } from './syntax-highlight.js';
import { lineMeta, setLineMeta } from './state.js';
import { outputArea } from './dom.js';

/**
 * Render JSON string with syntax highlighting and collapsible sections
 * @param {string} jsonString - Formatted JSON string to render
 */
export function renderJson(jsonString) {
    outputArea.innerHTML = '';
    const lines = jsonString.split('\n');
    const newLineMeta = new Array(lines.length);
    
    // 1. Analyze structure (Parent/Child relationships)
    const stack = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parent = stack.length > 0 ? stack[stack.length - 1] : -1;
        
        newLineMeta[i] = { 
            parent: parent, 
            collapsed: false,
            element: null,
            foldBtn: null,
            indicator: null
        };

        // Check for closing block
        if (/^\s*[}\]]/.test(line)) {
            if (stack.length > 0) {
                newLineMeta[i].parent = stack[stack.length - 1];
                stack.pop();
            }
        }

        // Check for opening block
        if (/[{\[]\s*,?$/.test(line)) {
            stack.push(i);
            newLineMeta[i].isStart = true;
        }
    }

    // 2. Render DOM
    const fragment = document.createDocumentFragment();
    
    lines.forEach((line, i) => {
        const row = document.createElement('div');
        row.className = 'line-row';
        row.id = `line-${i}`;
        newLineMeta[i].element = row;

        // Line Number
        const num = document.createElement('div');
        num.className = 'line-num';
        num.textContent = i + 1;
        row.appendChild(num);

        // Fold Gutter
        const gutter = document.createElement('div');
        gutter.className = 'fold-gutter';
        if (newLineMeta[i].isStart) {
            const icon = document.createElement('div');
            icon.className = 'fold-icon';
            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>`;
            icon.onclick = (e) => {
                e.stopPropagation();
                toggleFold(i);
            };
            gutter.appendChild(icon);
            newLineMeta[i].foldBtn = icon;
        }
        row.appendChild(gutter);

        // Content
        const content = document.createElement('div');
        content.className = 'code-content';
        content.innerHTML = syntaxHighlight(line);
        
        // Collapsed Indicator (...)
        if (newLineMeta[i].isStart) {
            const indicator = document.createElement('span');
            indicator.className = 'collapsed-indicator hidden';
            indicator.textContent = '...';
            indicator.onclick = (e) => {
                e.stopPropagation();
                toggleFold(i);
            };
            content.appendChild(indicator);
            newLineMeta[i].indicator = indicator;
        }

        row.appendChild(content);
        fragment.appendChild(row);
    });

    outputArea.appendChild(fragment);
    setLineMeta(newLineMeta);
}

/**
 * Toggle fold/unfold for a JSON block
 * @param {number} index - Line index to toggle
 */
export function toggleFold(index) {
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
