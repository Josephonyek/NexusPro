document.addEventListener("DOMContentLoaded", () => {
  const API_ENDPOINT = "/api/user-auth.js";

  // Elements
  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  const loginFields = document.getElementById("loginFields");
  const signupFields = document.getElementById("signupFields");
  const authForm = document.getElementById("authForm");
  const submitBtn = document.getElementById("submitBtn");
  const authAlert = document.getElementById("authAlert");

  const educationTypeSelect = document.getElementById("educationType");
  const secondaryOptions = document.getElementById("secondaryOptions");
  const tertiaryOptions = document.getElementById("tertiaryOptions");

  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const forgotModal = document.getElementById("forgotModal");
  const closeResetModal = document.getElementById("closeResetModal");
  const sendResetBtn = document.getElementById("sendResetBtn");

  let activeTab = "login";

  // ================= 1. TAB SWITCHING LOGIC =================
  function setTab(tab) {
    activeTab = tab;
    hideAlert();

    if (tab === "login") {
      loginTab.classList.add("active");
      signupTab.classList.remove("active");
      loginFields.style.display = "block";
      signupFields.style.display = "none";
      submitBtn.textContent = "Log In";
    } else {
      signupTab.classList.add("active");
      loginTab.classList.remove("active");
      loginFields.style.display = "none";
      signupFields.style.display = "block";
      submitBtn.textContent = "Create Account";
    }
  }

  if (loginTab) loginTab.addEventListener("click", () => setTab("login"));
  if (signupTab) signupTab.addEventListener("click", () => setTab("signup"));

  // ================= 2. CONDITIONAL EDUCATION FIELDS =================
  if (educationTypeSelect) {
    educationTypeSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "secondary") {
        secondaryOptions.style.display = "block";
        tertiaryOptions.style.display = "none";
      } else if (val === "tertiary") {
        tertiaryOptions.style.display = "block";
        secondaryOptions.style.display = "none";
      } else {
        secondaryOptions.style.display = "none";
        tertiaryOptions.style.display = "none";
      }
    });
  }

  // ================= 3. PASSWORD VISIBILITY TOGGLES =================
  document.querySelectorAll(".toggle-password").forEach((btn) => {
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

  // ================= 4. FORGOT PASSWORD MODAL =================
  

  // ================= 5. FORM SUBMISSION HANDLER =================
  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();

      let payload = {};
      const action = activeTab;

      if (action === "login") {
        const email = document.getElementById("loginEmail")?.value?.trim();
        const password = document.getElementById("loginPassword")?.value;

        if (!email || !password) {
          showAlert("Please enter your email and password.");
          return;
        }
        payload = { email, password };
      } else {
        const firstName = document.getElementById("firstName")?.value?.trim();
        const lastName = document.getElementById("lastName")?.value?.trim();
        const email = document.getElementById("signupEmail")?.value?.trim();
        const password = document.getElementById("signupPassword")?.value;

        if (!firstName || !lastName || !email || !password) {
          showAlert("Please fill out all required signup fields.");
          return;
        }

        payload = {
          firstName,
          lastName,
          email,
          password,
          educationType: educationTypeSelect?.value || "",
          studentClass: document.getElementById("studentClass")?.value || "",
          course: document.getElementById("course")?.value || "",
          level: document.getElementById("level")?.value || ""
        };
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Processing...";

      try {
        const response = await fetch(`${API_ENDPOINT}?action=${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Authentication failed.");
        }

        // Reset Storage and save fresh credentials
        localStorage.clear();
        localStorage.setItem("nexusToken", data.token);
        localStorage.setItem("nexusUser", JSON.stringify(data.user));
        localStorage.setItem("userRole", String(data.user.role).toLowerCase());

        // Redirect to dashboard
        window.location.href = "dashboard.html";

      } catch (err) {
        showAlert(err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = activeTab === "login" ? "Log In" : "Create Account";
      }
    });
  }

  function showAlert(msg) {
    if (authAlert) {
      authAlert.textContent = msg;
      authAlert.style.display = "block";
    }
  }

  function hideAlert() {
    if (authAlert) {
      authAlert.style.display = "none";
      authAlert.textContent = "";
    }
  }
});
