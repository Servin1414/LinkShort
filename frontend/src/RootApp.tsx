
import { useEffect, useState } from "react";
import App from "./App";
import AuthPage from "./pages/AuthPage";
import { api, type ApiUser } from "./services/api";

export default function RootApp() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const result = await api.me();

        if (active) {
          setUser(result.user ?? null);
          setSessionError("");
        }
      } catch (error) {
        if (active) {
          setUser(null);

          if (
            error instanceof Error &&
            error.message.includes("ارتباط با سرور برقرار نشد")
          ) {
            setSessionError(error.message);
          } else {
            setSessionError("");
          }
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await api.logout();
      setUser(null);
      setSessionError("");
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "خروج از حساب انجام نشد. دوباره تلاش کنید."
      );
    }
  }

  if (checkingSession) {
    return (
      <main className="auth-page" dir="rtl">
        <section className="auth-card">
          <div className="auth-brand">
            <span className="auth-brand-icon">L</span>
            <span>LinkShort</span>
          </div>

          <p className="auth-subtitle">
            در حال بررسی وضعیت ورود...
          </p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <>
        {sessionError && (
          <div
            role="alert"
            style={{
              position: "fixed",
              top: 12,
              left: 12,
              right: 12,
              zIndex: 10,
              padding: 12,
              borderRadius: 10,
              background: "#fef2f2",
              color: "#b91c1c",
              textAlign: "center",
              direction: "rtl",
            }}
          >
            {sessionError}
          </div>
        )}

        <AuthPage onAuthenticated={setUser} />
      </>
    );
  }

  return <App onLogout={handleLogout} />;
}
