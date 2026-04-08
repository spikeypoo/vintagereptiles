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
      <div className="signin-eyebrow">Vintage Reptiles</div>
      <h1 className="signin-heading">Sign in</h1>
      <p className="signin-subheading">Access the admin panel.</p>

      <form onSubmit={handleCredentialsSignIn}>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <label className="field-label" htmlFor="username">Username</label>
          <input id="username" name="username" placeholder="Enter username" className="form-input" autoComplete="username" />
          <label className="field-label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" placeholder="Enter password" className="form-input" autoComplete="current-password" />
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
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background:
            linear-gradient(180deg, #0a090b 0%, #100d12 100%);
        }

        .signin-card {
          width: 100%;
          max-width: 24rem;
          border-radius: 18px;
          padding: 2rem;
          background: rgba(16, 14, 18, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.4),
            0 1px 0 rgba(255, 255, 255, 0.03) inset;
        }

        .signin-eyebrow {
          margin: 0 0 0.8rem;
          color: #a29aa7;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .signin-heading {
          font-size: 2rem;
          color: #ffffff;
          margin: 0 0 0.35rem;
          line-height: 1.05;
          letter-spacing: -0.025em;
        }

        .signin-subheading {
          font-size: 0.95rem;
          color: #938b98;
          margin: 0 0 1.5rem;
          line-height: 1.45;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: grid;
          grid-template-columns: 1fr;
          row-gap: 0.55rem;
        }

        .field-label {
          color: #c9c2cd;
          font-size: 0.84rem;
          font-weight: 500;
        }

        .form-input {
          display: flex;
          width: 100%;
          padding: 0.85rem 0.95rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 0.95rem;
          color: #f4f2f5;
          background: #161319;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
          outline: none;
          box-sizing: border-box;
        }

        .form-input::placeholder {
          color: #6f6874;
        }

        .form-input:focus {
          border-color: rgba(203, 24, 219, 0.5);
          box-shadow: 0 0 0 3px rgba(203, 24, 219, 0.1);
          background: #18141b;
        }

        .error-msg {
          font-size: 0.84rem;
          color: #ffd8df;
          background: rgba(127, 29, 29, 0.22);
          border: 1px solid rgba(248, 113, 113, 0.18);
          border-radius: 10px;
          padding: 0.75rem 0.85rem;
          margin: 0;
        }

        .submit-btn {
          width: 100%;
          margin-top: 0.2rem;
          padding: 0.9rem 1rem;
          background: #cb18db;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
        }

        .submit-btn:hover {
          background: #d72be6;
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(203, 24, 219, 0.18);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .signin-wrapper {
            padding: 1rem;
          }

          .signin-card {
            border-radius: 16px;
            padding: 1.4rem;
          }

          .signin-heading {
            font-size: 1.75rem;
          }
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
      
