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
    }
    function show(id) {
        const modal = document.getElementById(id);
        const content = modal.querySelector(`#${id}-content`);
        if (!modal) return;
        console.log("Modal-show: ", id)
        modal.classList.remove('hidden');
        modal.classList.remove('opacity-0', 'pointer-events-none');
        content.classList.add('opacity-100', 'pointer-events-auto');

        // Animate modal content in
        content.classList.remove('scale-95', 'translate-y-4');
        content.classList.add('scale-100', 'translate-y-0');
    }

    function hide(id) {
        const modal = document.getElementById(id);
        const content = modal.querySelector(`#${id}-content`);
        if (!modal) return;
        console.log("Modal-hide: ", id)
        modal.classList.add('hidden');
        modal.classList.add('opacity-0', 'pointer-events-none');
        content.classList.remove('opacity-100', 'pointer-events-auto');

        // Animate modal content out
        content.classList.add('scale-95', 'translate-y-4');
        content.classList.remove('scale-100', 'translate-y-0');
    }

    function toggle(id) {
        const modal = document.getElementById(id);
        if (!modal) {
            return;
        }
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            modal.classList.remove('opacity-0');
            modal.classList.remove('pointer-events-none');
            return;
        }
        if (!modal.classList.contains('hidden')) {
            modal.classList.add('hidden')
        }


    }
    return { register, show, hide, toggle };
})();
