async function checkAuthSession() {
  const token = localStorage.getItem("nx_token");
  const loadingScreen = document.getElementById("loading-screen");

  if (!token) {
    window.location.replace("auth.html");
    return;
  }

  try {
    const res = await fetch("/api/user-auth?action=verify", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!data.authenticated) {
      throw new Error("Session expired");
    }

    // Update UI elements with verified profile
    applyState(data.user.role, data.user.name);

  } catch (err) {
    localStorage.clear();
    window.location.replace("auth.html");
  } finally {
    if (loadingScreen) loadingScreen.classList.add("hidden");
  }
}

checkAuthSession();
