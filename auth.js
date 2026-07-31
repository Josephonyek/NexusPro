// Login Handler
document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("login-email")?.value.trim();
  const password = document.getElementById("login-password")?.value;

  try {
    const response = await fetch("/api/user-auth?action=login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    // Save session locally
    localStorage.setItem("nx_token", data.token);
    localStorage.setItem("nx_role", data.user.role);
    localStorage.setItem("nx_name", data.user.name);
    localStorage.setItem("nx_uid", data.user.uid);

    window.location.replace("dashboard.html");
  } catch (err) {
    alert(err.message || "Login failed.");
  }
});

// Signup Handler
document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    firstName: document.getElementById("first-name")?.value.trim(),
    lastName: document.getElementById("last-name")?.value.trim(),
    email: document.getElementById("signup-email")?.value.trim(),
    password: document.getElementById("signup-password")?.value,
    educationType: document.getElementById("education-type")?.value,
    studentClass: document.getElementById("secondary-class")?.value || null,
    course: document.getElementById("course")?.value || null,
    level: document.getElementById("level")?.value || null
  };

  try {
    const response = await fetch("/api/user-auth?action=signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    localStorage.setItem("nx_token", data.token);
    localStorage.setItem("nx_role", data.user.role);
    localStorage.setItem("nx_name", data.user.name);
    localStorage.setItem("nx_uid", data.user.uid);

    window.location.replace("dashboard.html");
  } catch (err) {
    alert(err.message || "Sign up failed.");
  }
});
