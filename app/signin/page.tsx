"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = (searchParams.get("callbackUrl") ?? "/panel") as string;
  const [error, setError] = useState("");

  const handleCredentialsSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl,
    });

    if (res?.error) {
      setError("Invalid username or password.");
    } else if (res?.url) {
      window.location.href = res.url;
    }
  };

  return (
    <div className="signin-card">
      <div className="signin-logo">
        <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 2L3 7v11h5v-5h4v5h5V7L10 2z"/>
        </svg>
      </div>

      <h1 className="signin-heading">Welcome back</h1>
      <p className="signin-subheading">Sign in to your account to continue</p>

      <button onClick={() => signIn("google", { callbackUrl })} className="google-btn">
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.96L3.964 7.292C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="divider">
        <div className="divider-line" />
        <span className="divider-text">or</span>
        <div className="divider-line" />
      </div>

      <form onSubmit={handleCredentialsSignIn}>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <input name="username" placeholder="Username" className="form-input" autoComplete="username" />
          <input name="password" type="password" placeholder="Password" className="form-input" autoComplete="current-password" />
        </div>
        <button type="submit" className="submit-btn">Sign in</button>
      </form>
    </div>
  );
}

export default function SignInPage() {
  return (
    <>
      <style>{`
        .signin-wrapper {
          font-family: inherit;
          font-size: inherit;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0e0e0e;
          padding: 2rem;
        }

        .signin-card {
          background: #161616;
          border-radius: 20px;
          padding: 3rem 3rem 2.5rem;
          width: 100%;
          max-width: 420px;
          box-shadow:
            0 1px 2px rgba(0,0,0,0.4),
            0 4px 12px rgba(0,0,0,0.4),
            0 20px 40px rgba(0,0,0,0.5);
          border: 1px solid #262626;
        }

        .signin-logo {
          width: 40px;
          height: 40px;
          background: #222;
          border-radius: 10px;
          margin-bottom: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #333;
        }

        .signin-logo svg {
          width: 20px;
          height: 20px;
          fill: #c8a97e;
        }

        .signin-heading {
          font-size: 2rem;
          color: #f0ece6;
          margin: 0 0 0.35rem;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }

        .signin-subheading {
          font-size: 0.875rem;
          color: #555;
          margin: 0 0 2rem;
          font-weight: 400;
        }

        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          padding: 0.75rem 1.25rem;
          background: #1e1e1e;
          border: 1.5px solid #2e2e2e;
          border-radius: 10px;
          font-size: inherit;
          font-weight: 500;
          color: #ccc;
          cursor: pointer;
          transition: all 0.18s ease;
          margin-bottom: 1.5rem;
        }

        .google-btn:hover {
          background: #222;
          border-color: #c8a97e;
          color: #f0ece6;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }

        .google-btn:active {
          transform: translateY(0);
        }

        .google-btn svg {
          flex-shrink: 0;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #252525;
        }

        .divider-text {
          font-size: 0.75rem;
          color: #444;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          margin-bottom: 1.25rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1.5px solid #2a2a2a;
          border-radius: 10px;
          font-size: inherit;
          color: #f0ece6;
          background: #1a1a1a;
          transition: all 0.18s ease;
          outline: none;
          box-sizing: border-box;
        }

        .form-input::placeholder {
          color: #444;
        }

        .form-input:focus {
          border-color: #c8a97e;
          background: #1e1e1e;
          box-shadow: 0 0 0 3px rgba(200, 169, 126, 0.1);
        }

        .error-msg {
          font-size: 0.8rem;
          color: #f08080;
          background: #2a1515;
          border: 1px solid #4a2020;
          border-radius: 8px;
          padding: 0.6rem 0.875rem;
          margin-bottom: 0.25rem;
        }

        .submit-btn {
          width: 100%;
          padding: 0.8rem 1.25rem;
          background: #c8a97e;
          color: #0e0e0e;
          border: none;
          border-radius: 10px;
          font-size: inherit;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .submit-btn:hover {
          background: #e8c89a;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(200, 169, 126, 0.25);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

      `}</style>

      <div className="signin-wrapper">
        <Suspense fallback={<div style={{ color: "#555" }}>Loading...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </>
  );
}
      