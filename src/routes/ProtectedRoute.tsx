import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import type { ViewType, Profile } from '../types';
import { turnPage } from '../utils/pageTurn';

interface ProtectedRouteProps {
  activeProfile: Profile | null;
  onLockProfile: () => void;
  onProfileUpdated?: (profile: Profile) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  activeProfile,
  onLockProfile,
  onProfileUpdated,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  if (!activeProfile) {
    return <Navigate to="/login" replace />;
  }

  // Deduce current view from pathname
  const path = location.pathname.replace('/', '') || 'dashboard';
  const currentView: ViewType = ['dashboard', 'agenda', 'planner', 'todo', 'notes', 'folders', 'integrations'].includes(path)
    ? (path as ViewType)
    : 'dashboard';

  const handleViewChange = (view: ViewType) => {
    turnPage(() => navigate(`/${view}`));
  };

  return (
    <AppLayout
      profile={activeProfile}
      currentView={currentView}
      onViewChange={handleViewChange}
      onLockProfile={onLockProfile}
      onProfileUpdated={onProfileUpdated}
    >
      <Outlet />
    </AppLayout>
  );
};
