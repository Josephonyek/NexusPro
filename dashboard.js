/**
 * Nexus Pro - Student Grid Console Controller
 */

document.addEventListener("DOMContentLoaded", () => {
    // Dismiss rendering blocks preloader
    const loader = document.getElementById("preloader");
    if (loader) {
        loader.classList.add("fade-out");
        setTimeout(() => loader.remove(), 300);
    }

    // Toggle logic for the layout notification area container 
    const bellBtn = document.getElementById("bell-toggle-btn");
    const notifyPane = document.getElementById("notification-pane");
    const dot = document.querySelector(".notification-dot");

    if (bellBtn && notifyPane) {
        bellBtn.addEventListener("click", (e) => {
            e.preventDefault();
            notifyPane.classList.toggle("active");
            
            // Clear notification badge icon light indicator once viewed
            if (dot) dot.style.display = "none";
        });
    }
});

/**
 * Simulates text engine parsing actions inside Box 1
 */
function executeLocalAISolver() {
    const textInput = document.getElementById("ai-query-input").value.trim();
    const outputArea = document.getElementById("ai-output-box");

    if (!textInput) {
        outputArea.innerHTML = "<span style='color:#ef4444;'>Error: Input parameter missing.</span>";
        return;
    }

    outputArea.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Processing logical evaluation lines...";

    setTimeout(() => {
        outputArea.innerHTML = `<strong>Analysis Complete:</strong> Verified query parsing for: "${textInput}".<br><br>Detailed curriculum steps generated inside structural database cache blocks.`;
    }, 1000);
}

/**
 * Processes mock support workspace array logging for Box 4
 */
function dispatchLocalTicket() {
    const title = document.getElementById("ticket-title").value.trim();
    const desc = document.getElementById("ticket-desc").value.trim();

    if (!title || !desc) {
        alert("Please completely describe your interface logging state.");
        return;
    }

    alert("Console Event: Support database logging complete!");
    document.getElementById("ticket-title").value = "";
    document.getElementById("ticket-desc").value = "";
}

/**
 * Triggers logout session flush scripts
 */
function handleSignOutAction() {
    localStorage.removeItem("nexus_user_session");
    window.location.replace("login.html");
        }
