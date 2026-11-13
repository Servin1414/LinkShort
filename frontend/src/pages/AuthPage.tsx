
import { useState, type FormEvent } from "react";
import { Link2, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { api, type ApiUser } from "../services/api";
import "./AuthPage.css";

interface AuthPageProps {
  onAuthenticated: (user: ApiUser) => void;
}

export default function AuthPage({
  onAuthenticated,
}: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result =
        mode === "register"
          ? await api.register({
              name: name.trim(),
              email: email.trim(),
              password,
            })
          : await api.login({
              email: email.trim(),
              password,
            });

      if (!result.user) {
        throw new Error("اطلاعات حساب از سرور دریافت نشد.");
      }

      onAuthenticated(result.user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "خطایی رخ داد. دوباره تلاش کنید."
      );
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError("");
  }

  return (
    <main className="auth-page" dir="rtl">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon">
            <Link2 size={27} />
          </span>
          <span>LinkShort</span>
        </div>

        <h1>
          {mode === "login" ? "خوش برگشتی!" : "ساخت حساب کاربری"}
        </h1>

        <p className="auth-subtitle">
          {mode === "login"
            ? "برای مدیریت لینک‌های کوتاه خود وارد شوید."
            : "برای شروع مدیریت لینک‌های خود حساب بسازید."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => changeMode("login")}
            disabled={loading}
          >
            ورود
          </button>

          <button
            type="button"
            className={mode === "register" ? "auth-tab active" : "auth-tab"}
            onClick={() => changeMode("register")}
            disabled={loading}
          >
            ثبت‌نام
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="auth-field">
              <label htmlFor="auth-name">نام</label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                minLength={2}
                maxLength={60}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="نام شما"
                disabled={loading}
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">ایمیل</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              dir="ltr"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">رمز عبور</label>

            <div className="auth-password-wrap">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={mode === "register" ? 8 : undefined}
                maxLength={72}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  mode === "register"
                    ? "حداقل ۸ کاراکتر"
                    : "رمز عبور خود را وارد کنید"
                }
                dir="ltr"
                disabled={loading}
              />

              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"
                }
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle className="auth-spinner" size={18} />
                در حال بررسی...
              </>
            ) : mode === "login" ? (
              "ورود به حساب"
            ) : (
              "ساخت حساب کاربری"
            )}
          </button>
        </form>

        <p className="auth-footer">
          LinkShort · مدیریت ساده‌تر لینک‌ها
        </p>
      </section>
    </main>
  );
}
