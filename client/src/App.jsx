
import React, { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import LoadingPage from './pages/LoadingPage'; 
import Loader from './pages/LoadingPage'; 

const LoginPage = lazy(() => import('./pages/LoginPage'));
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
    <div className="bg-background min-h-screen"><Navbar /><main className="pt-20">{children}</main></div>
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
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register/invite/:token" element={<InvitedRegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:resetToken" element={<UpdatePasswordPage />} />
        
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute allowedRoles={['student']}><MainLayout><GameLibraryPage /></MainLayout></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><MainLayout><SupportPage /></MainLayout></ProtectedRoute>} />
        <Route path="/my-games" element={<ProtectedRoute allowedRoles={['student']}><MainLayout><MyGames /></MainLayout></ProtectedRoute>} />
        
        <Route path="/games/cyber-security" element={<ProtectedRoute allowedRoles={['student']}><GameLayout><CyberSecurityGame /></GameLayout></ProtectedRoute>} />
        <Route path="/games/data-forge" element={<ProtectedRoute allowedRoles={['student']}><GameLayout><DataForgeGame /></GameLayout></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['schooladmin']}><MainLayout><AdminDashboard /></MainLayout></ProtectedRoute>} />
        <Route path="/admin/manage-users" element={<ProtectedRoute allowedRoles={['schooladmin']}><MainLayout><ManageUsers /></MainLayout></ProtectedRoute>} />
        <Route path="/admin/games" element={<ProtectedRoute allowedRoles={['schooladmin']}><MainLayout><AdminGamesPage /></MainLayout></ProtectedRoute>} />
        <Route path="/admin/games-progress" element={<ProtectedRoute allowedRoles={['schooladmin']}><MainLayout><GamesProgressPage /></MainLayout></ProtectedRoute>} />

        <Route path="/superadmin/dashboard" element={<ProtectedRoute allowedRoles={['superadmin']}><MainLayout><SuperAdminDashboard /></MainLayout></ProtectedRoute>} />
        <Route path="/superadmin/schools" element={<ProtectedRoute allowedRoles={['superadmin']}><MainLayout><ManageSchools /></MainLayout></ProtectedRoute>} />
        <Route path="/superadmin/admins" element={<ProtectedRoute allowedRoles={['superadmin']}><MainLayout><ManageAdmins /></MainLayout></ProtectedRoute>} />
        
        <Route path="*" element={<h1 className="text-foreground text-center mt-20">404: Page Not Found</h1>} />
      </Routes>
    </Suspense>
  );
}

export default App;