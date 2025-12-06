/**
 * Syntax Highlighting Module
 * Provides syntax highlighting for JSON
 */

/**
 * Apply syntax highlighting to JSON string
 * @param {string} json - JSON string to highlight
 * @returns {string} - HTML string with syntax highlighting
 */
export function syntaxHighlight(json) {
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
