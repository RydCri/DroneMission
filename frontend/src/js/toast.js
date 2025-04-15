export function showToast(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('toast');
    const messageEl = document.getElementById('toast-message');
    const progress = document.getElementById('toast-progress');

    messageEl.textContent = message;

    toast.classList.remove('bg-green-600', 'bg-red-600', 'bg-yellow-500');
    if (type === 'success') toast.classList.add('bg-green-600');
    if (type === 'error') toast.classList.add('bg-red-600');
    if (type === 'warning') toast.classList.add('bg-yellow-500');

    // Reset progress bar
    progress.classList.remove('w-0');
    progress.style.transitionDuration = `${duration}ms`;
    progress.style.width = '100%';

    toast.classList.remove('hidden');
    toast.classList.add('opacity-100');

    // Start the progress animation slightly delayed (to force reflow)
    setTimeout(() => {
        progress.style.width = '0%';
    }, 10);

    // Hide toast after timeout
    setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('hidden');
    }, duration);
}
