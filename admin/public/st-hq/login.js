const TOKEN_KEY = "senay_admin_token";
const ADMIN_KEY = "senay-cms-admin";
const AUTH_FAILED_KEY = "senay_auth_failed";
const API_CANDIDATES = ["/api", "/st-hq/api"];
const LOGIN_URL = `${window.location.origin}/st-hq/login.html`;
const DASHBOARD_URL = `${window.location.origin}/st-hq/`;

const statusEl = document.getElementById("auth-status");
const errorEl = document.getElementById("auth-error");
const switchBtn = document.getElementById("switch-account");

function setStatus(message) {
  if (statusEl) {
    statusEl.hidden = !message;
    statusEl.textContent = message || "";
  }
}

function setError(message) {
  if (!errorEl) return;
  if (!message) {
    errorEl.hidden = true;
    errorEl.textContent = "";
    return;
  }
  errorEl.hidden = false;
  errorEl.textContent = message;
}

function wireLogoFallbacks() {
  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    const fallback = img.getAttribute("data-fallback");
    if (!fallback) return;
    img.addEventListener("error", () => {
      if (img.dataset.fallbackApplied === "1") return;
      img.dataset.fallbackApplied = "1";
      img.src = fallback;
    });
  });
}

async function apiFetch(path, options = {}) {
  let lastError = null;
  for (const base of API_CANDIDATES) {
    try {
      const res = await fetch(`${base}${path}`, options);
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        lastError = new Error("API returned HTML instead of JSON");
        continue;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        lastError = new Error(json.error || `Request failed (${res.status})`);
        continue;
      }
      return json.data ?? json;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Network error");
    }
  }
  throw lastError || new Error("Unable to reach API");
}

async function exchangeSession(sessionToken) {
  setStatus("Checking admin access…");
  const data = await apiFetch("/admin/auth/clerk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionToken }),
  });
  if (!data?.token) {
    throw new Error("Server did not return an admin session token");
  }
  localStorage.setItem(TOKEN_KEY, data.token);
  if (data.admin) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin));
  }
  sessionStorage.removeItem(AUTH_FAILED_KEY);
  setStatus("Signed in — opening dashboard…");
  window.location.replace(DASHBOARD_URL);
}

async function main() {
  wireLogoFallbacks();

  try {
    const config = await apiFetch("/admin/auth/clerk-config");
    const publishableKey = config.publishableKey;
    if (!publishableKey) {
      throw new Error("Clerk publishable key is missing");
    }

    const { Clerk } = await import("https://esm.sh/@clerk/clerk-js@5");
    const clerk = new Clerk(publishableKey);
    await clerk.load({
      signInForceRedirectUrl: LOGIN_URL,
      signInFallbackRedirectUrl: LOGIN_URL,
      signUpForceRedirectUrl: LOGIN_URL,
      signUpFallbackRedirectUrl: LOGIN_URL,
    });

    setStatus("");

    if (switchBtn) {
      switchBtn.hidden = false;
      switchBtn.addEventListener("click", async () => {
        setError("");
        setStatus("Switching account…");
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ADMIN_KEY);
        try {
          await clerk.signOut({ redirectUrl: LOGIN_URL });
        } catch {
          window.location.replace(LOGIN_URL);
        }
      });
    }

    const authFailed = sessionStorage.getItem(AUTH_FAILED_KEY) === "1";

    if (authFailed) {
      setStatus("Your session expired. Please sign in again.");
      if (clerk.user) {
        try {
          await clerk.signOut();
        } catch {
          /* ignore */
        }
      }
    } else if (clerk.user) {
      const sessionToken = await clerk.session?.getToken();
      if (sessionToken) {
        await exchangeSession(sessionToken);
        return;
      }
    }

    clerk.mountSignIn(document.getElementById("clerk-sign-in"), {
      routing: "hash",
      withSignUp: false,
      signInForceRedirectUrl: LOGIN_URL,
      signInFallbackRedirectUrl: LOGIN_URL,
      signUpForceRedirectUrl: LOGIN_URL,
      signUpFallbackRedirectUrl: LOGIN_URL,
      appearance: {
        layout: {
          socialButtonsPlacement: "top",
          socialButtonsVariant: "blockButton",
          showOptionalFields: false,
        },
        variables: {
          colorPrimary: "#2C1A14",
          colorText: "#2C1A14",
          colorTextSecondary: "rgba(44,26,20,0.55)",
          colorBackground: "transparent",
          colorInputBackground: "#FAF5EE",
          colorInputText: "#2C1A14",
          colorNeutral: "#2C1A14",
          borderRadius: "0.9rem",
          fontFamily: "Inter, system-ui, sans-serif",
          fontFamilyButtons: "Inter, system-ui, sans-serif",
        },
        elements: {
          rootBox: { width: "100%" },
          cardBox: {
            width: "100%",
            boxShadow: "none",
            border: "none",
            background: "transparent",
          },
          card: {
            width: "100%",
            boxShadow: "none",
            border: "none",
            background: "transparent",
            padding: "0",
            gap: "0.85rem",
          },
          header: { display: "none" },
          headerTitle: { display: "none" },
          headerSubtitle: { display: "none" },
          main: { gap: "0.85rem" },
          socialButtonsBlockButton: {
            border: "1px solid rgba(44,26,20,0.14)",
            background: "#FFFFFF",
            color: "#2C1A14",
            fontWeight: "600",
            borderRadius: "0.9rem",
            minHeight: "48px",
          },
          socialButtonsBlockButtonText: {
            color: "#2C1A14",
            fontWeight: "600",
          },
          dividerRow: { display: "none" },
          dividerLine: { display: "none" },
          dividerText: { display: "none" },
          formFieldRow: { display: "none" },
          formButtonPrimary: { display: "none" },
          footer: { display: "none" },
          footerAction: { display: "none" },
        },
      },
      localization: {
        signIn: {
          start: {
            title: "Sign in to Senay Tela Admin",
            subtitle:
              "Use the Google account for the email your super admin granted access to.",
            actionText: "",
            actionLink: "",
          },
        },
        socialButtonsBlockButton: "Continue with Google",
      },
    });

    clerk.addListener(async ({ user, session }) => {
      if (!user || !session) return;
      try {
        setError("");
        const sessionToken = await session.getToken();
        if (!sessionToken) throw new Error("Missing Clerk session token");
        await exchangeSession(sessionToken);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Sign-in failed");
        setStatus("");
        try {
          await clerk.signOut();
        } catch {
          /* ignore */
        }
      }
    });
  } catch (error) {
    setStatus("");
    setError(error instanceof Error ? error.message : "Unable to load Clerk sign-in");
  }
}

main();
