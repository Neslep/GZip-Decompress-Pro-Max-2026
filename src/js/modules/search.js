/**
 * Search Module
 * Handles search functionality for JSON output
 */

import { 
    searchBtn, searchBar, searchInput, searchMatchCount, 
    searchPrevBtn, searchNextBtn, searchCloseBtn, 
    searchCaseSensitive, outputArea 
} from './dom.js';
import { 
    searchMatches, currentMatchIndex, originalJsonString,
    setSearchMatches, setCurrentMatchIndex, setOriginalContent 
} from './state.js';

/**
 * Toggle search bar visibility
 */
export function toggleSearch() {
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

/**
 * Clear search state and highlights
 */
export function clearSearch() {
    searchInput.value = '';
    setSearchMatches([]);
    setCurrentMatchIndex(-1);
    updateSearchHighlights();
    updateMatchCount();
}

/**
 * Escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Perform search in output
 */
function performSearch() {
    const query = searchInput.value;

    if (!query) {
        clearSearch();
        return;
    }

    // Clear previous highlights
    const newSearchMatches = [];
    setCurrentMatchIndex(-1);

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

        newSearchMatches.push(...tempMatches);
    });

    setSearchMatches(newSearchMatches);

    // Update highlights and navigate to first match
    if (searchMatches.length > 0) {
        setCurrentMatchIndex(0);
        updateSearchHighlights();
        scrollToCurrentMatch();
    }

    updateMatchCount();
}

/**
 * Update search highlights in the output
 */
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

/**
 * Highlight text in a DOM element
 * @param {HTMLElement} element - Element to highlight in
 * @param {RegExp} regex - Search regex
 * @param {Array} matches - Array of match objects
 */
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

/**
 * Scroll to current match
 */
function scrollToCurrentMatch() {
    if (currentMatchIndex < 0 || currentMatchIndex >= searchMatches.length) return;

    const currentHighlight = outputArea.querySelector('.search-highlight-current');
    if (currentHighlight) {
        currentHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Navigate to next match
 */
function navigateToNextMatch() {
    if (searchMatches.length === 0) return;

    setCurrentMatchIndex((currentMatchIndex + 1) % searchMatches.length);
    updateSearchHighlights();
    scrollToCurrentMatch();
    updateMatchCount();
}

/**
 * Navigate to previous match
 */
function navigateToPrevMatch() {
    if (searchMatches.length === 0) return;

    let newIndex = currentMatchIndex - 1;
    if (newIndex < 0) {
        newIndex = searchMatches.length - 1;
    }
    setCurrentMatchIndex(newIndex);
    updateSearchHighlights();
    scrollToCurrentMatch();
    updateMatchCount();
}

/**
 * Update match count display
 */
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

/**
 * Initialize search functionality
 */
export function initSearch() {
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
}
