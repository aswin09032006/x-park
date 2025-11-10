import { Bell, ChevronRight, LogOut, Sun, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; // Import the useTheme hook
import { getAvatarUrl } from '../utils/avatar';

// A reusable toggle switch component
const ToggleSwitch = ({ checked, onChange }) => (
  <button onClick={onChange} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}>
    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const ProfilePopup = ({ user, onLogout }) => {
  const { theme, toggleTheme } = useTheme(); // Use the theme context

  // --- NICKNAME DISPLAY LOGIC ---
  const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const displayName = user.nickname || userFullName || user.username;

  return (
    <div className="absolute top-14 right-0 w-80 bg-popover text-popover-foreground rounded-lg shadow-lg p-6 z-50 border border-border">
      {/* Profile Header */}
      <div className="flex items-center mb-4">
        <img 
          src={getAvatarUrl(user)}
          alt="User Avatar" 
          className="w-16 h-16 rounded-full object-cover" 
        />
        <div className="ml-4 overflow-hidden">
          {/* --- MODIFIED --- */}
          <p className="font-bold text-lg truncate">{displayName}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      <hr className="border-border mb-4" />

      {/* Menu Items */}
      <ul className="space-y-2">
        <Link to="/profile">
            <li className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer">
              <div className="flex items-center">
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="ml-3">My Profile</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </li>
        </Link>

        {/* This notification toggle is for UI demonstration only */}
        <li className="flex items-center justify-between p-2 rounded-md">
          <div className="flex items-center">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="ml-3">Notification</span>
          </div>
          <ToggleSwitch checked={true} onChange={() => {}} />
        </li>

        {/* THEME TOGGLE */}
        <li className="flex items-center justify-between p-2 rounded-md">
          <div className="flex items-center">
            <Sun className="w-5 h-5 text-yellow-400" />
            <span className="ml-3">Dark</span>
          </div>
          <ToggleSwitch checked={theme === 'dark'} onChange={toggleTheme} />
        </li>

        <li 
          onClick={onLogout}
          className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-pink-500" />
          <span className="ml-3">Log Out</span>
        </li>
      </ul>
    </div>
  );
};

export default ProfilePopup;
