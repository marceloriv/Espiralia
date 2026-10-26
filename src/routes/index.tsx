import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { turnPage } from '../utils/pageTurn';
import { ProtectedRoute } from './ProtectedRoute';
import { ProfileGateView } from '../components/ProfileGateView';
import { RouteLoadingFallback } from '../components/RouteLoadingFallback';
import type { Profile } from '../types';

const DashboardView = lazy(() => import('../components/DashboardView').then(m => ({ default: m.DashboardView })));
const AgendaView = lazy(() => import('../components/AgendaView').then(m => ({ default: m.AgendaView })));
const PlannerView = lazy(() => import('../components/PlannerView').then(m => ({ default: m.PlannerView })));
const TodoView = lazy(() => import('../components/TodoView').then(m => ({ default: m.TodoView })));
const NotesView = lazy(() => import('../components/NotesView').then(m => ({ default: m.NotesView })));
const FoldersView = lazy(() => import('../components/FoldersView').then(m => ({ default: m.FoldersView })));
const IntegrationsView = lazy(() => import('../components/IntegrationsView').then(m => ({ default: m.IntegrationsView })));
const LandingView = lazy(() => import('../components/LandingView').then(m => ({ default: m.LandingView })));
const NotFoundView = lazy(() => import('../components/NotFoundView').then(m => ({ default: m.NotFoundView })));

interface AppRoutesProps {
  activeProfile: Profile | null;
  onSelectProfile: (profile: Profile) => void;
  onLockProfile: () => void;
  onProfileUpdated?: (profile: Profile) => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  activeProfile,
  onSelectProfile,
  onLockProfile,
  onProfileUpdated,
}) => {
  const navigate = useNavigate();

  const handleProfileSelected = (profile: Profile) => {
    onSelectProfile(profile);
    navigate('/dashboard');
  };

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route
        path="/inicio"
        element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <LandingView
              onNavigateLogin={() => navigate('/login')}
              onNavigateDashboard={() => navigate('/dashboard')}
              hasActiveProfile={Boolean(activeProfile)}
            />
          </Suspense>
        }
      />
      <Route
        path="/login"
        element={
          <ProfileGateView
            onSelectProfile={handleProfileSelected}
            onNavigateLanding={() => navigate('/inicio')}
          />
        }
      />

      {/* Raíz: bienvenida editorial si no hay perfil; redirección a dashboard si ya está autenticado */}
      <Route
        path="/"
        element={
          activeProfile ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Suspense fallback={<RouteLoadingFallback />}>
              <LandingView
                onNavigateLogin={() => navigate('/login')}
                onNavigateDashboard={() => navigate('/dashboard')}
                hasActiveProfile={false}
              />
            </Suspense>
          )
        }
      />

      {/* Rutas protegidas */}
      <Route
        element={
          <ProtectedRoute
            activeProfile={activeProfile}
            onLockProfile={onLockProfile}
            onProfileUpdated={onProfileUpdated}
          />
        }
      >
        <Route
          path="/dashboard"
          element={
            activeProfile ? (
              <Suspense fallback={<RouteLoadingFallback />}>
                <DashboardView
                  profile={activeProfile}
                  onNavigate={view => turnPage(() => navigate(`/${view}`))}
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
        <Route
          path="/notes"
          element={
            activeProfile ? (
              <Suspense fallback={<RouteLoadingFallback />}>
                <NotesView profileId={activeProfile.id} />
              </Suspense>
            ) : null
          }
        />
        <Route
          path="/folders"
          element={
            activeProfile ? (
              <Suspense fallback={<RouteLoadingFallback />}>
                <FoldersView profileId={activeProfile.id} />
              </Suspense>
            ) : null
          }
        />
        <Route
          path="/integrations"
          element={
            activeProfile ? (
              <Suspense fallback={<RouteLoadingFallback />}>
                <IntegrationsView profile={activeProfile} />
              </Suspense>
            ) : null
          }
        />
      </Route>

      {/* Dirección desconocida: pantalla 404 en vez de una redirección en silencio */}
      <Route
        path="*"
        element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <NotFoundView
              hasActiveProfile={Boolean(activeProfile)}
              onNavigateHome={() => navigate(activeProfile ? '/dashboard' : '/inicio')}
            />
          </Suspense>
        }
      />
    </Routes>
  );
};
