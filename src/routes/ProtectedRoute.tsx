import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import type { ViewType, Profile } from '../types';

interface ProtectedRouteProps {
  activeProfile: Profile | null;
  onLockProfile: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  activeProfile,
  onLockProfile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  if (!activeProfile) {
    return <Navigate to="/login" replace />;
  }

  // Deduce current view from pathname
  const path = location.pathname.replace('/', '') || 'dashboard';
  const currentView: ViewType = ['dashboard', 'agenda', 'planner', 'todo'].includes(path)
    ? (path as ViewType)
    : 'dashboard';

  const handleViewChange = (view: ViewType) => {
    navigate(`/${view}`);
  };

  return (
    <AppLayout
      profile={activeProfile}
      currentView={currentView}
      onViewChange={handleViewChange}
      onLockProfile={onLockProfile}
    >
      <Outlet />
    </AppLayout>
  );
};
