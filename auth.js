document.addEventListener("DOMContentLoaded", () => {
  const API_ENDPOINT = "/api/user-auth.js";

  // --- UI Elements ---
  const authForm = document.getElementById("authForm");
  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  const loginFields = document.getElementById("loginFields");
  const signupFields = document.getElementById("signupFields");
  const educationTypeSelect = document.getElementById("educationType");
  const secondaryOptions = document.getElementById("secondaryOptions");
  const tertiaryOptions = document.getElementById("tertiaryOptions");
  const togglePasswordBtns = document.querySelectorAll(".toggle-password");
  const authAlert = document.getElementById("authAlert");
  const submitBtn = document.getElementById("submitBtn");

  let currentMode = "login"; // Default active tab

  // ================= 1. RELIABLE TAB SWITCHING =================
  function switchTab(mode) {
    currentMode = mode;
    hideAlert();

    if (mode === "login") {
      if (loginTab) loginTab.classList.add("active");
      if (signupTab) signupTab.classList.remove("active");

      if (loginFields) loginFields.style.display = "block";
      if (signupFields) signupFields.style.display = "none";

      if (submitBtn) submitBtn.textContent = "Log In";
    } else {
      if (signupTab) signupTab.classList.add("active");
      if (loginTab) loginTab.classList.remove("active");

      if (loginFields) loginFields.style.display = "none";
      if (signupFields) signupFields.style.display = "block";

      if (submitBtn) submitBtn.textContent = "Create Account";
    }
  }

  // Event Listeners for Tab Buttons
  if (loginTab) {
    loginTab.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab("login");
    });
  }

  if (signupTab) {
    signupTab.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab("signup");
    });
  }

  // Initialize default state
  switchTab("login");

  // ================= 2. CONDITIONAL EDUCATION FIELDS =================
  if (educationTypeSelect) {
    educationTypeSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "secondary") {
        if (secondaryOptions) secondaryOptions.style.display = "block";
        if (tertiaryOptions) tertiaryOptions.style.display = "none";
      } else if (val === "tertiary") {
        if (tertiaryOptions) tertiaryOptions.style.display = "block";
        if (secondaryOptions) secondaryOptions.style.display = "none";
      } else {
        if (secondaryOptions) secondaryOptions.style.display = "none";
        if (tertiaryOptions) tertiaryOptions.style.display = "none";
      }
    });
  }

  // ================= 3. PASSWORD VISIBILITY TOGGLE =================
  togglePasswordBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === "password") {
          input.type = "text";
          btn.textContent = "Hide";
        } else {
          input.type = "password";
          btn.textContent = "Show";
        }
      }
    });
  });

  // ================= 4. FORM SUBMISSION & ROLE STORAGE =================
  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();

      const action = currentMode;
      let payload = {};

      if (action === "login") {
        const email = document.getElementById("loginEmail")?.value?.trim();
        const password = document.getElementById("loginPassword")?.value;

        if (!email || !password) {
          showAlert("Please enter both email and password.");
          return;
        }

        payload = { email, password };
      } else {
        const firstName = document.getElementById("firstName")?.value?.trim();
        const lastName = document.getElementById("lastName")?.value?.trim();
        const email = document.getElementById("signupEmail")?.value?.trim();
        const password = document.getElementById("signupPassword")?.value;
        const educationType = document.getElementById("educationType")?.value;
        const studentClass = document.getElementById("studentClass")?.value;
        const course = document.getElementById("course")?.value;
        const level = document.getElementById("level")?.value;

        if (!firstName || !lastName || !email || !password) {
          showAlert("Please fill in all required registration fields.");
          return;
        }

        payload = {
          firstName,
          lastName,
          email,
          password,
          educationType,
          studentClass,
          course,
          level
        };
      }

      setLoading(true);

      try {
        const response = await fetch(`${API_ENDPOINT}?action=${action}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Authentication failed. Please check your credentials.");
        }

        // --- PURGE ALL STALE STORAGE KEYS ---
        localStorage.clear();

        // --- SAVE FRESH TOKEN AND ROLE ---
        const userRole = String(data.user.role || "student").toLowerCase();

        localStorage.setItem("nexusToken", data.token);
        localStorage.setItem("token", data.token); // Backup key
        localStorage.setItem("nexusUser", JSON.stringify(data.user));
        localStorage.setItem("userRole", userRole); // Direct role key ('admin' or 'student')

        // Redirect to dashboard
        window.location.href = "dashboard.html";

      } catch (err) {
        showAlert(err.message);
      } finally {
        setLoading(false);
      }
    });
  }

  // --- Helper Alert & Loading Functions ---
  function showAlert(msg) {
    if (authAlert) {
      authAlert.textContent = msg;
      authAlert.style.display = "block";
    } else {
      alert(msg);
    }
  }

  function hideAlert() {
    if (authAlert) {
      authAlert.style.display = "none";
      authAlert.textContent = "";
    }
  }

  function setLoading(isLoading) {
    if (!submitBtn) return;
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.dataset.origText = submitBtn.textContent;
      submitBtn.textContent = "Processing...";
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.origText || "Submit";
    }
  }
});
