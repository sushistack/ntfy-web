import { useState } from "react";
import { useTranslation } from "react-i18next";
import config from "../app/config";
import session from "../app/Session";
import routes from "./routes";
import { accountTokenUrl, withBasicAuth } from "../app/utils";
import { fetchOrThrow, UnauthorizedError } from "../app/errors";

const requestToken = async (username, password) => {
  const response = await fetchOrThrow(accountTokenUrl(config.base_url), {
    method: "POST",
    headers: withBasicAuth({}, username, password),
  });
  const { token } = await response.json();
  if (!token) {
    throw new Error();
  }
  return token;
};

const Login = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (!config.require_login) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const token = await requestToken(username, password);
      await session.store(username, token);
      window.location.href = routes.app;
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        setError(t("login_error_invalid_credentials"));
      } else {
        setError(t("login_error_unexpected"));
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-sm flex flex-col gap-6 p-6">
        <h1 className="text-title font-semibold text-text text-center">{t("login_title")}</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="login-username" className="text-body-sm font-medium text-text">
              {t("signup_form_username")}
            </label>
            <input
              id="login-username"
              className="w-full rounded-sm bg-surface-2 border border-control-border px-3 py-2 text-body-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              autoComplete="username"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="login-password" className="text-body-sm font-medium text-text">
              {t("signup_form_password")}
            </label>
            <div className="relative">
              <input
                id="login-password"
                className="w-full rounded-sm bg-surface-2 border border-control-border px-3 py-2 pr-10 text-body-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value.trim())}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-1 right-1 flex items-center rounded-sm px-1 text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                aria-label={t("signup_form_toggle_password_visibility")}
                onClick={() => setShowPassword((v) => !v)}
                onMouseDown={(e) => e.preventDefault()}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-body-sm text-priority-urgent">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={username === "" || password === ""}
            className="w-full h-10 px-4 rounded-sm bg-button-fill text-button-fill-text text-body-sm font-semibold hover:bg-surface-2 disabled:opacity-50 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            {t("login_form_button_submit")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
