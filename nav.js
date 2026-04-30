(function () {

    var toggle = document.querySelector('.nav-toggle');
    var nav    = document.getElementById('main-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        toggle.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });

    /* Cerrar al hacer clic en un enlace (útil en SPA-style y anclas) */
    nav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
            nav.classList.remove('open');
            toggle.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Abrir menú');
        });
    });
})();
