import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthPage } from "./components/auth/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ApiError } from "./services/api.client";
import {
  fetchCurrentUser,
  signOut,
  verifyAccount,
} from "./services/auth.api";
import type { AuthUser } from "./types/auth.types";

function App() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const verificationToken = new URLSearchParams(window.location.search).get(
      "verifyToken",
    );

    if (verificationToken) {
      window.history.replaceState(null, "", window.location.pathname);
      void verifyAccount(verificationToken)
        .then((message) => {
          if (!active) return;
          setAuthMessage(message);
          setIsCheckingSession(false);
        })
        .catch((error: unknown) => {
          if (!active) return;
          setAuthError(
            error instanceof Error ? error.message : "Email verification failed.",
          );
          setIsCheckingSession(false);
        });
    } else {
      void fetchCurrentUser()
        .then((currentUser) => {
          if (!active) return;
          setUser(currentUser);
          setIsCheckingSession(false);
        })
        .catch((error: unknown) => {
          if (!active) return;
          if (!(error instanceof ApiError && error.status === 401)) {
            setAuthError(
              error instanceof Error ? error.message : "Could not check your session.",
            );
          }
          setIsCheckingSession(false);
        });
    }

    return () => {
      active = false;
    };
  }, []);

  function handleSignIn(signedInUser: AuthUser): void {
    queryClient.clear();
    setAuthError(null);
    setAuthMessage(null);
    setUser(signedInUser);
  }

  async function handleSignOut(): Promise<void> {
    try {
      await signOut();
      queryClient.clear();
      setUser(null);
      setAuthError(null);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        queryClient.clear();
        setUser(null);
        setAuthError(null);
        return;
      }
      setAuthError(
        error instanceof Error ? error.message : "Could not sign out.",
      );
    }
  }

  if (isCheckingSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f8fc]">
        <p role="status" className="text-sm text-slate-500">
          Checking your session...
        </p>
      </main>
    );
  }

  if (!user) {
    if (authError) {
      return (
        <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-4">
          <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-800 shadow-sm">
            <p role="alert">{authError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 font-semibold underline"
            >
              Try again
            </button>
          </div>
        </main>
      );
    }
    return (
      <AuthPage
        onSignIn={handleSignIn}
        verificationMessage={authMessage}
      />
    );
  }

  return (
    <>
      {authError && (
        <p
          role="alert"
          className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-center text-sm text-rose-800"
        >
          {authError}
        </p>
      )}
      <DashboardPage
        userEmail={user.email}
        onSignOut={() => void handleSignOut()}
      />
    </>
  );
}

export default App;
