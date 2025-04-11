// src/js/modals.js

export const ModalManager = (() => {
    const modals = {};

    function register(id) {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`Modal #${id} not found`);
            return;
        }

        modals[id] = el;

        // Add close handler if an 'X' button exists
        const closeBtn = el.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => hide(id));
        }
    }

    function show(id) {
        Object.values(modals).forEach(m => m.classList.add('hidden'));
        if (modals[id]) modals[id].classList.remove('hidden');
    }

    function hide(id) {
        if (modals[id]) modals[id].classList.add('hidden');
    }

    function toggle(id) {
        if (modals[id]) modals[id].classList.toggle('hidden');
    }

    return { register, show, hide, toggle };
})();
