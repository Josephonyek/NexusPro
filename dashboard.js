// Execute immediately when the DOM structural tree is ready (No waiting for external media)
document.addEventListener("DOMContentLoaded", () => {
    initPreloader();
    initNavigationMenu();
});

/**
 * Handles fast preloader dismissal
 */
function initPreloader() {
    const preloader = document.getElementById("preloader");
    if (preloader) {
        // Enforce immediate class addition for a snappy layout reveal
        preloader.classList.add("fade-out");
        
        // Completely clear element from DOM tree after CSS opacity transitions finish
        setTimeout(() => {
            preloader.remove();
        }, 300);
    }
}

/**
 * Manages side navigation panel toggles and dynamic section switching
 */
function initNavigationMenu() {
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.getElementById("sidebar");
    const menuLinks = document.querySelectorAll(".menu-link");
    const tabContents = document.querySelectorAll(".tab-content");

    // 1. Mobile Hamburger Toggle Handler
    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.toggle("active");
        });

        // Auto-close sidebar on mobile when clicking anywhere outside the menu
        document.addEventListener("click", (e) => {
            if (sidebar.classList.contains("active") && !sidebar.contains(e.target) && e.target !== menuToggle) {
                sidebar.classList.remove("active");
            }
        });
    }

    // 2. High-Speed Tab Switching Controller
    menuLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetTabId = link.getAttribute("data-tab");

            if (!targetTabId) return;

            // Update Active Link State UI
            menuLinks.forEach(item => item.classList.remove("active"));
            link.classList.add("active");

            // Switch Visible View Content
            tabContents.forEach(content => {
                if (content.id === targetTabId) {
                    content.classList.add("active");
                } else {
                    content.classList.remove("active");
                }
            });

            // On mobile viewports, collapse the sidebar automatically after a selection
            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.remove("active");
            }
        });
    });
}
