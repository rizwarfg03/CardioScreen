import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Patients from './pages/Patients.jsx';
import PatientHistory from './pages/PatientHistory.jsx';
import UploadEcg from './pages/UploadEcg.jsx';
import PreviewEcg from './pages/PreviewEcg.jsx';
import EcgArchive from './pages/EcgArchive.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import HealthInfo from './pages/HealthInfo.jsx';
import HealthArticleDetail from './pages/HealthArticleDetail.jsx';
import BiomedicalEngineering from './pages/BiomedicalEngineering.jsx';
import Team from './pages/Team.jsx';
import AboutSystem from './pages/AboutSystem.jsx';
import MadiunSaradan from './pages/MadiunSaradan.jsx';
import Landing from './pages/Landing.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/archive"
        element={
          <ProtectedRoute>
            <EcgArchive />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <Patients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <ProtectedRoute>
            <PatientHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute roles={['nurse', 'admin']}>
            <UploadEcg />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ecg/:id"
        element={
          <ProtectedRoute>
            <PreviewEcg />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/health-info"
        element={
          <ProtectedRoute>
            <HealthInfo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/health-info/:id"
        element={
          <ProtectedRoute>
            <HealthArticleDetail />
          </ProtectedRoute>
        }
      />
      <Route path="/biomedical-engineering" element={<BiomedicalEngineering />} />
      <Route path="/team" element={<Team />} />
      <Route path="/madiun-saradan" element={<MadiunSaradan />} />
      <Route
        path="/about-system"
        element={
          <ProtectedRoute>
            <AboutSystem />
          </ProtectedRoute>
        }
      />

      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Landing />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

