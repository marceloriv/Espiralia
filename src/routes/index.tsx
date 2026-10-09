import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ProfileGateView } from '../components/ProfileGateView';
import { DashboardView } from '../components/DashboardView';
import { AgendaView } from '../components/AgendaView';
import { PlannerView } from '../components/PlannerView';
import { TodoView } from '../components/TodoView';
import type { Profile } from '../types';

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
              <DashboardView
                profile={activeProfile}
                onNavigate={view => navigate(`/${view}`)}
              />
            ) : null
          }
        />
        <Route
          path="/agenda"
          element={activeProfile ? <AgendaView profileId={activeProfile.id} /> : null}
        />
        <Route
          path="/planner"
          element={activeProfile ? <PlannerView profileId={activeProfile.id} /> : null}
        />
        <Route
          path="/todo"
          element={activeProfile ? <TodoView profileId={activeProfile.id} /> : null}
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
