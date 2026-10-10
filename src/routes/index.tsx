import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ProfileGateView } from '../components/ProfileGateView';
import { RouteLoadingFallback } from '../components/RouteLoadingFallback';
import type { Profile } from '../types';

const DashboardView = lazy(() => import('../components/DashboardView').then(m => ({ default: m.DashboardView })));
const AgendaView = lazy(() => import('../components/AgendaView').then(m => ({ default: m.AgendaView })));
const PlannerView = lazy(() => import('../components/PlannerView').then(m => ({ default: m.PlannerView })));
const TodoView = lazy(() => import('../components/TodoView').then(m => ({ default: m.TodoView })));

interface AppRoutesProps {
  activeProfile: Profile | null;
  onSelectProfile: (profile: Profile) => void;
  onLockProfile: () => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  activeProfile,
  onSelectProfile,
  onLockProfile,
}) => {
  const navigate = useNavigate();

  const handleProfileSelected = (profile: Profile) => {
    onSelectProfile(profile);
    navigate('/dashboard');
  };

  return (
    <Routes>
      {/* Ruta pública: Selector / Creador de perfil */}
      <Route
        path="/login"
        element={<ProfileGateView onSelectProfile={handleProfileSelected} />}
      />

      {/* Rutas protegidas */}
      <Route
        element={
          <ProtectedRoute
            activeProfile={activeProfile}
            onLockProfile={onLockProfile}
          />
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            activeProfile ? (
              <Suspense fallback={<RouteLoadingFallback />}>
                <DashboardView
                  profile={activeProfile}
                  onNavigate={view => navigate(`/${view}`)}
                />
              </Suspense>
            ) : null
          }
        />
        <Route
          path="/agenda"
          element={
            activeProfile ? (
              <Suspense fallback={<RouteLoadingFallback />}>
                <AgendaView profileId={activeProfile.id} />
              </Suspense>
            ) : null
          }
        />
        <Route
          path="/planner"
          element={
            activeProfile ? (
              <Suspense fallback={<RouteLoadingFallback />}>
                <PlannerView profileId={activeProfile.id} />
              </Suspense>
            ) : null
          }
        />
        <Route
          path="/todo"
          element={
            activeProfile ? (
              <Suspense fallback={<RouteLoadingFallback />}>
                <TodoView profileId={activeProfile.id} />
              </Suspense>
            ) : null
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
