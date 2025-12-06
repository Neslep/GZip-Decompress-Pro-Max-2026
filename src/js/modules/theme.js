/**
 * Theme Management Module
 * Handles light/dark/system theme switching
 */

import { themeButtons, themeIndicator, themeRipple } from './dom.js';

const THEME_STORAGE_KEY = 'gzip-converter-theme';
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};

let currentThemePreference = THEMES.SYSTEM;

/**
 * Get system theme preference
 * @returns {string} - 'dark' or 'light'
 */
function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
}

/**
 * Create ripple effect for theme transition
 * @param {Event} event - Click event
 */
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

/**
 * Update indicator position
 * @param {string} theme - Theme name
 */
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

/**
 * Apply theme to document
 * @param {string} theme - Theme to apply
 * @param {boolean} withRipple - Whether to show ripple effect
 * @param {Event|null} event - Click event for ripple
 */
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

/**
 * Set theme and save to localStorage
 * @param {string} theme - Theme to set
 * @param {Event} event - Click event
 */
function setTheme(theme, event) {
    currentThemePreference = theme;
    localStorage.setItem(THEME_STORAGE_KEY, currentThemePreference);
    applyTheme(currentThemePreference, true, event);
}

/**
 * Initialize theme system
 */
export function initTheme() {
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

    // Event listeners for theme buttons
    themeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = btn.dataset.theme;
            setTheme(theme, e);
        });
    });
}
