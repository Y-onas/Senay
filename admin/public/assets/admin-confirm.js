/**
 * Styled confirmation dialog for Senay Tela admin destructive actions.
 * Loaded before the admin bundle; exposes window.adminConfirm(options) -> Promise<boolean>
 */
(function () {
  const STYLE_ID = "admin-confirm-styles";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .admin-confirm-overlay {
        position: fixed; inset: 0; z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        padding: 1rem; background: rgba(28, 16, 18, 0.55);
        animation: admin-confirm-fade-in 0.15s ease-out;
      }
      .admin-confirm-dialog {
        width: min(100%, 28rem);
        border-radius: 0.75rem;
        border: 1px solid rgba(114, 47, 55, 0.15);
        background: #fffaf5;
        box-shadow: 0 24px 48px rgba(28, 16, 18, 0.18);
        padding: 1.5rem;
        animation: admin-confirm-zoom-in 0.15s ease-out;
      }
      .admin-confirm-title {
        margin: 0 0 0.5rem;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 1.25rem;
        font-weight: 700;
        color: #722f37;
      }
      .admin-confirm-description {
        margin: 0 0 1.25rem;
        font-size: 0.9375rem;
        line-height: 1.5;
        color: #6b4c3b;
      }
      .admin-confirm-actions {
        display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: flex-end;
      }
      .admin-confirm-btn {
        appearance: none; border-radius: 0.5rem; border: 1px solid transparent;
        padding: 0.55rem 1rem; font-size: 0.875rem; font-weight: 600; cursor: pointer;
      }
      .admin-confirm-btn:focus-visible {
        outline: 2px solid #722f37; outline-offset: 2px;
      }
      .admin-confirm-btn-cancel {
        background: #fff; border-color: rgba(114, 47, 55, 0.2); color: #722f37;
      }
      .admin-confirm-btn-cancel:hover { background: #fdf6ef; }
      .admin-confirm-btn-confirm {
        background: #722f37; color: #fffaf5;
      }
      .admin-confirm-btn-confirm:hover { background: #5c252c; }
      .admin-confirm-btn-confirm.destructive {
        background: #9f1239;
      }
      .admin-confirm-btn-confirm.destructive:hover { background: #881337; }
      @keyframes admin-confirm-fade-in {
        from { opacity: 0; } to { opacity: 1; }
      }
      @keyframes admin-confirm-zoom-in {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * @param {object} options
   * @param {string} options.title
   * @param {string} [options.description]
   * @param {string} [options.confirmLabel="Confirm"]
   * @param {string} [options.cancelLabel="Cancel"]
   * @param {"destructive"|"default"} [options.variant="destructive"]
   * @returns {Promise<boolean>}
   */
  function adminConfirm(options) {
    const {
      title,
      description = "",
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      variant = "destructive",
    } = options || {};

    if (!title) {
      return Promise.resolve(window.confirm(description || "Are you sure?"));
    }

    ensureStyles();

    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "admin-confirm-overlay";
      overlay.setAttribute("role", "presentation");

      const dialog = document.createElement("div");
      dialog.className = "admin-confirm-dialog";
      dialog.setAttribute("role", "alertdialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-labelledby", "admin-confirm-title");
      dialog.setAttribute("aria-describedby", "admin-confirm-description");

      const titleEl = document.createElement("h2");
      titleEl.id = "admin-confirm-title";
      titleEl.className = "admin-confirm-title";
      titleEl.textContent = title;

      const descEl = document.createElement("p");
      descEl.id = "admin-confirm-description";
      descEl.className = "admin-confirm-description";
      descEl.textContent = description;

      const actions = document.createElement("div");
      actions.className = "admin-confirm-actions";

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "admin-confirm-btn admin-confirm-btn-cancel";
      cancelBtn.textContent = cancelLabel;

      const confirmBtn = document.createElement("button");
      confirmBtn.type = "button";
      confirmBtn.className =
        "admin-confirm-btn admin-confirm-btn-confirm" +
        (variant === "destructive" ? " destructive" : "");
      confirmBtn.textContent = confirmLabel;

      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        document.removeEventListener("keydown", onKeyDown);
        overlay.remove();
        resolve(value);
      };

      const onKeyDown = (event) => {
        if (event.key === "Escape") finish(false);
      };

      cancelBtn.addEventListener("click", () => finish(false));
      confirmBtn.addEventListener("click", () => finish(true));
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) finish(false);
      });

      actions.append(cancelBtn, confirmBtn);
      dialog.append(titleEl);
      if (description) dialog.append(descEl);
      dialog.append(actions);
      overlay.append(dialog);
      document.body.appendChild(overlay);
      document.addEventListener("keydown", onKeyDown);
      cancelBtn.focus();
    });
  }

  window.adminConfirm = adminConfirm;
})();
