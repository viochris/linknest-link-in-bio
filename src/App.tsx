import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { AuthUser } from './types';
import { PublicProfileRoute } from './routes/PublicProfileRoute';
import { AdminDashboardRoute } from './routes/AdminDashboardRoute';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { LandingPage } from './components/landing/LandingPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Synchronize session with Supabase Auth
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }: any) => {
        if (data?.session?.user) {
          setCurrentUser({
            id: data.session.user.id,
            email: data.session.user.email,
          });
        } else {
          setCurrentUser(null);
        }
        setAuthLoading(false);
      })
      .catch(() => {
        setAuthLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: string, session: any) => {
        if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
          });
        } else {
          setCurrentUser(null);
        }
        setAuthLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Route /admin/login: Login form via Supabase Auth. Redirect to /admin if already authenticated */}
        <Route
          path="/admin/login"
          element={
            authLoading ? (
              <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : currentUser ? (
              <Navigate to="/admin" replace />
            ) : (
              <AdminLoginPage
                onLoginSuccess={(user) => setCurrentUser(user)}
              />
            )
          }
        />

        {/* Route /admin and /dashboard: Protected Admin Dashboard ONLY */}
        <Route
          path="/admin"
          element={
            authLoading ? (
              <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : currentUser ? (
              <AdminDashboardRoute
                user={currentUser}
                onLogoutSuccess={() => setCurrentUser(null)}
              />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

        {/* Root Route /: If visitor has active session -> redirect to /admin. Otherwise -> Landing/Sign In page */}
        <Route
          path="/"
          element={
            authLoading ? (
              <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : currentUser ? (
              <Navigate to="/admin" replace />
            ) : (
              <LandingPage />
            )
          }
        />

        {/* Route /:username: Public Profile Page for that specific user, fully accessible without requiring login */}
        <Route path="/:username" element={<PublicProfileRoute />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

