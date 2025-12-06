/**
 * State Management Module
 * Manages application state
 */

// Line metadata for JSON rendering
export let lineMeta = [];

// Original JSON string for copying
export let originalJsonString = '';

// Search state
export let searchMatches = [];
export let currentMatchIndex = -1;
export let originalContent = '';

// Setters for state management
export function setLineMeta(value) {
    lineMeta = value;
}

export function setOriginalJsonString(value) {
    originalJsonString = value;
}

export function setSearchMatches(value) {
    searchMatches = value;
}

export function setCurrentMatchIndex(value) {
    currentMatchIndex = value;
}

export function setOriginalContent(value) {
    originalContent = value;
}

// Reset search state
export function resetSearchState() {
    searchMatches = [];
    currentMatchIndex = -1;
    originalContent = '';
}
