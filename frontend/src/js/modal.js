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
        const modal = document.getElementById(id);
        const content = modal.querySelector(`#${id}-content`);
        if (!modal || !content) return;
        modal.classList.remove('hidden');
        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.classList.add('opacity-100', 'pointer-events-auto');

        // Animate modal content in
        content.classList.remove('scale-95', 'translate-y-4');
        content.classList.add('scale-100', 'translate-y-0');
    }

    function hide(id) {
        const modal = document.getElementById(id);
        const content = modal.querySelector(`#${id}-content`);
        if (!modal || !content) return;
        modal.classList.add('hidden');
        modal.classList.add('opacity-0', 'pointer-events-none');
        modal.classList.remove('opacity-100', 'pointer-events-auto');

        // Animate modal content out
        content.classList.add('scale-95', 'translate-y-4');
        content.classList.remove('scale-100', 'translate-y-0');
    }

    function toggle(id) {
        if (modals[id]) modals[id].classList.toggle('hidden');
    }

    return { register, show, hide, toggle };
})();
