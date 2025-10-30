import { Route, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import { useAuth } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import AdminGamesPage from './pages/AdminGamesPage';
import CyberSecurityGame from './pages/CyberSecurityGame';
import DashboardPage from './pages/Dashboard';
import DataForgeGame from './pages/DataForgeGame';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import GameLibraryPage from './pages/GameLibraryPage';
import InvitedRegisterPage from './pages/InvitedRegisterPage';
import LoadingPage from './pages/LoadingPage';
import LoginPage from './pages/LoginPage';
import ManageAdmins from './pages/ManageAdmins';
import ManageSchools from './pages/ManageSchools';
import ManageUsers from './pages/ManageUsers';
import MyGames from './pages/MyGames';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SupportPage from './pages/SupportPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
// --- NEW: Import the new page component ---
import GamesProgressPage from './pages/GamesProgressPage';

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
        {/* --- NEW: Add the route for the games progress page --- */}
        <Route path="/admin/games-progress" element={<AdminRoute><MainLayout><GamesProgressPage /></MainLayout></AdminRoute>} />

        <Route path="/superadmin/dashboard" element={<SuperAdminRoute><MainLayout><SuperAdminDashboard /></MainLayout></SuperAdminRoute>} />
        <Route path="/superadmin/schools" element={<SuperAdminRoute><MainLayout><ManageSchools /></MainLayout></SuperAdminRoute>} />
        <Route path="/superadmin/admins" element={<SuperAdminRoute><MainLayout><ManageAdmins /></MainLayout></SuperAdminRoute>} />
        
        <Route path="*" element={<h1 className="text-white text-center mt-20">404: Page Not Found</h1>} />
      </Routes>
  );
}

export default App;