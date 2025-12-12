"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuth } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        setStatus("error");
        setErrorMessage(errorDescription || error || "Authentication failed");
        return;
      }

      // Backend handles the OAuth callback and sets cookies
      // We just need to refresh the auth state
      try {
        await refreshAuth();
        setStatus("success");
        // Redirect to home after a brief delay
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } catch (err) {
        setStatus("error");
        setErrorMessage("Failed to complete authentication");
      }
    };

    handleCallback();
  }, [searchParams, refreshAuth, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Authenticating...</h1>
            <p className="text-[var(--muted)]">Please wait while we complete your sign-in.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold mb-2">Sign-in successful!</h1>
            <p className="text-[var(--muted)]">Redirecting you to the homepage...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold mb-2">Authentication failed</h1>
            <p className="text-[var(--muted)] mb-4">{errorMessage}</p>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-90 transition-opacity"
            >
              Return to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
