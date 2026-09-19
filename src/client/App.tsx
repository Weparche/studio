import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/client/hooks/useAuth";
import { LoginPage } from "@/client/pages/LoginPage";
import { SettingsPage } from "@/client/pages/SettingsPage";
import { StudioPage } from "@/client/pages/StudioPage";
import { UsagePage } from "@/client/pages/UsagePage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-[var(--text-faint)]">
        Loading…
      </div>
    );
  }

  if (status?.required && !status.authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <StudioPage />
              </RequireAuth>
            }
          />
          <Route
            path="/usage"
            element={
              <RequireAuth>
                <UsagePage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
