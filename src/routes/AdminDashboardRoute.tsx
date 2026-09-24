import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthUser, Profile } from '../types';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { ShareProfileModal } from '../components/common/ShareProfileModal';
import { supabase } from '../lib/supabase';
import { Check } from 'lucide-react';

interface AdminDashboardRouteProps {
  user: AuthUser;
  onLogoutSuccess?: () => void;
}

export const AdminDashboardRoute: React.FC<AdminDashboardRouteProps> = ({
  user,
  onLogoutSuccess,
}) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileUsername, setProfileUsername] = useState<string>(user.email?.split('@')[0] || 'creator');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<any>(null);

  // Fetch logged-in user's profile for clipboard URL and QR code metadata
  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          if (data.username) {
            setProfileUsername(data.username);
          }
        } else if (user.email) {
          setProfileUsername(user.email.split('@')[0]);
        }
      })
      .catch(() => {});
  }, [user.id, user.email]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    if (onLogoutSuccess) onLogoutSuccess();
    navigate('/admin/login', { replace: true });
  };

  const handleViewPublicProfile = (slug: string) => {
    navigate(`/${slug}`);
  };

  /**
   * Opens the rich Share Profile Modal with direct social options (WhatsApp, X, LinkedIn, Telegram, etc.)
   */
  const handleShareProfile = (overrideSlug?: string) => {
    if (overrideSlug) {
      setProfileUsername(overrideSlug);
    }
    setIsShareModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 relative w-full max-w-full overflow-x-hidden">
      <AdminDashboard
        user={user}
        onLogout={handleLogout}
        onViewPublicProfile={handleViewPublicProfile}
        onShareProfile={handleShareProfile}
      />

      {/* Share Profile Modal with Direct Social Channels & Copy Link Options */}
      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onOpenQrModal={() => {
          setIsShareModalOpen(false);
          window.dispatchEvent(new CustomEvent('linknest:navigate_tab', { detail: 'qrcode' }));
        }}
        profile={profile || {
          id: user.id,
          user_id: user.id,
          username: profileUsername,
          display_name: user.email?.split('@')[0] || profileUsername,
          bio: '',
          avatar_url: '/icon.svg',
          theme: 'dark',
          accent_color: '#818cf8',
          button_style: 'rounded',
          is_verified: true,
          social_layout: 'top',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }}
      />

      {/* Small Toast Notification Confirmation */}
      {toastMessage && (
        <div
          id="share-toast-notification"
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 border border-indigo-500/40 text-white shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-[calc(100vw-3rem)]"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-slate-100 truncate">{toastMessage}</span>
          <Check className="w-3.5 h-3.5 text-emerald-400 ml-1 shrink-0" />
        </div>
      )}
    </div>
  );
};
