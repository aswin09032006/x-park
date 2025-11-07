// src/App.jsx

import React, { Suspense, lazy } from 'react'; // --- THIS IS THE FIX: Import Suspense and lazy ---
import { Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import { useAuth } from './context/AuthContext';
import LoadingPage from './pages/LoadingPage'; // Keep for main auth loading
import Loader from './pages/LoadingPage'; // A loader for Suspense fallback

// --- THIS IS THE FIX: Lazy load page components ---
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const InvitedRegisterPage = lazy(() => import('./pages/InvitedRegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const GameLibraryPage = lazy(() => import('./pages/GameLibraryPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const MyGames = lazy(() => import('./pages/MyGames'));
const CyberSecurityGame = lazy(() => import('./pages/CyberSecurityGame'));
const DataForgeGame = lazy(() => import('./pages/DataForgeGame'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ManageUsers = lazy(() => import('./pages/ManageUsers'));
const AdminGamesPage = lazy(() => import('./pages/AdminGamesPage'));
const GamesProgressPage = lazy(() => import('./pages/GamesProgressPage'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const ManageSchools = lazy(() => import('./pages/ManageSchools'));
const ManageAdmins = lazy(() => import('./pages/ManageAdmins'));

const MainLayout = ({ children }) => (
    <div className="bg-[#111] min-h-screen"><Navbar /><main className="pt-20">{children}</main></div>
);
const GameLayout = ({ children }) => (
    <div className="bg-background h-screen w-screen overflow-hidden">{children}</div>
);

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  return (
    // --- THIS IS THE FIX: Wrap Routes with Suspense to handle lazy loading ---
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/invite/:token" element={<InvitedRegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:resetToken" element={<UpdatePasswordPage />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><MainLayout><GameLibraryPage /></MainLayout></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><MainLayout><SupportPage /></MainLayout></ProtectedRoute>} />
        <Route path="/my-games" element={<ProtectedRoute><MainLayout><MyGames /></MainLayout></ProtectedRoute>} />
        
        <Route path="/games/cyber-security" element={<ProtectedRoute><GameLayout><CyberSecurityGame /></GameLayout></ProtectedRoute>} />
        <Route path="/games/data-forge" element={<ProtectedRoute><GameLayout><DataForgeGame /></GameLayout></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<AdminRoute><MainLayout><AdminDashboard /></MainLayout></AdminRoute>} />
        <Route path="/admin/manage-users" element={<AdminRoute><MainLayout><ManageUsers /></MainLayout></AdminRoute>} />
        <Route path="/admin/games" element={<AdminRoute><MainLayout><AdminGamesPage /></MainLayout></AdminRoute>} />
        <Route path="/admin/games-progress" element={<AdminRoute><MainLayout><GamesProgressPage /></MainLayout></AdminRoute>} />

        <Route path="/superadmin/dashboard" element={<SuperAdminRoute><MainLayout><SuperAdminDashboard /></MainLayout></SuperAdminRoute>} />
        <Route path="/superadmin/schools" element={<SuperAdminRoute><MainLayout><ManageSchools /></MainLayout></SuperAdminRoute>} />
        <Route path="/superadmin/admins" element={<SuperAdminRoute><MainLayout><ManageAdmins /></MainLayout></SuperAdminRoute>} />
        
        <Route path="*" element={<h1 className="text-white text-center mt-20">404: Page Not Found</h1>} />
      </Routes>
    </Suspense>
  );
}

export default App;