import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../hooks/useAuth";
import { useAuthStore } from "../store/authStore";
import SignUp from "./SignUp";

interface LoginFormState {
  email: string;
  password: string;
}

const INITIAL_LOGIN_FORM: LoginFormState = {
  email: "",
  password: "",
};

export default function Login() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loginMutation = useLoginMutation();
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [form, setForm] = useState<LoginFormState>(INITIAL_LOGIN_FORM);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError("");

    if (!form.email.trim() || !form.password.trim()) {
      setValidationError("Email and password are required.");
      return;
    }

    loginMutation.mutate(form);
  };

  if (isSignupMode) {
    return (
      <div className="auth-page">
        <SignUp onSwitchToLogin={() => setIsSignupMode(false)} />
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Login</h1>
        <p className="auth-subtitle">Sign in to view your project dashboard.</p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Email
            <input
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="you@example.com"
              type="email"
            />
          </label>

          <label>
            Password
            <input
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="••••••••"
              type="password"
            />
          </label>

          {validationError && <p className="state-message error">{validationError}</p>}
          {loginMutation.isError && (
            <p className="state-message error">{(loginMutation.error as Error).message}</p>
          )}

          <button disabled={loginMutation.isPending} type="submit">
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </button>
        </form>

        <button className="link-button" onClick={() => setIsSignupMode(true)} type="button">
          Don&apos;t have an account? Sign Up
        </button>
      </div>
    </div>
  );
}
