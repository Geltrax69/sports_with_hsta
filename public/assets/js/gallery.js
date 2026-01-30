/**
 * Initializes the gallery scroll functionality.
 * Correctly calculates scroll distance based on current item width to prevent snap-back issues.
 */
function initGallery() {
    const container = document.getElementById('gallery-container');
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');

    // Exit if elements don't exist
    if (!container || !prevBtn || !nextBtn) return;

    const scroll = (direction) => {
        // measure the first item to get exact width
        const item = container.firstElementChild;
        if (!item) return;

        // Get the gap (default to 16px if not found)
        const style = window.getComputedStyle(container);
        const gap = parseFloat(style.gap) || 16;

        // precise distance to next snap point
        const distance = item.offsetWidth + gap;

        if (direction === 'next') {
            container.scrollBy({ left: distance, behavior: 'smooth' });
        } else {
            container.scrollBy({ left: -distance, behavior: 'smooth' });
        }
    };

    prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scroll('prev');
    });

    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        scroll('next');
    });
}
