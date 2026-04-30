(function () {
    var STORAGE_KEY = 'avantservice-theme';

    function getStored() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    function setStored(val) {
        try { localStorage.setItem(STORAGE_KEY, val); } catch (e) {}
    }

    function applyTheme(theme) {
        /* Bloquea transiciones un frame para evitar saltos de layout */
        var style = document.createElement('style');
        style.textContent = '*, *::before, *::after { transition: none !important; }';
        document.head.appendChild(style);

        document.documentElement.setAttribute('data-theme', theme);
        setStored(theme);

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                document.head.removeChild(style);
            });
        });
    }

    /* Aplica el tema guardado antes de pintar (sin flash) */
    var saved = getStored();
    if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    document.addEventListener('DOMContentLoaded', function () {
        var btn = document.getElementById('theme-toggle');
        if (!btn) return;

        btn.addEventListener('click', function () {
            var current = document.documentElement.getAttribute('data-theme');
            applyTheme(current === 'light' ? 'dark' : 'light');
        });
    });
})();
