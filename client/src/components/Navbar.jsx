import { useEffect, useRef, useState, memo } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Settings } from 'lucide-react';
import { FiSearch } from 'react-icons/fi';
import ProfilePopup from './ProfilePopup';
import logo from '/XPLogo.png';
import { getAvatarUrl } from '../utils/avatar';

const Navbar = () => {
  const { user, logout } = useAuth(); 
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const popupRef = useRef(null);

  let navLinks = [];
  let logoLink = '/'; 

  if (user) {
    switch (user.role) {
      case 'student':
        logoLink = '/dashboard';
        navLinks = [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Game Library', path: '/library' },
          { name: 'My Games', path: '/my-games' },
          { name: 'Support', path: '/support' },
        ];
        break;
      case 'schooladmin':
        logoLink = '/admin/dashboard';
        navLinks = [
          { name: 'Dashboard', path: '/admin/dashboard' },
          { name: 'Students', path: '/admin/manage-users' },
          { name: 'Game Library', path: '/admin/games' },
          { name: 'Games Progress', path: '/admin/games-progress' },
        ];
        break;
      case 'superadmin':
        logoLink = '/superadmin/dashboard';
        navLinks = [
          { name: 'Dashboard', path: '/superadmin/dashboard' },
          { name: 'Manage Schools', path: '/superadmin/schools' },
          { name: 'Manage Admins', path: '/superadmin/admins' },
        ];
        break;
      default:
        navLinks = [];
        logoLink = '/';
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsPopupOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user) {
    return null;
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm text-foreground flex items-center justify-between px-8 py-4 border-b border-border">
      <div className="flex items-center space-x-12">
        <Link to={logoLink}>
            <img src={logo} alt="XPARK Logo" className="h-7 dark:filter-none filter invert" />
        </Link>
        <ul className="flex items-center space-x-8">
          {navLinks.map((link) => (
            <li key={link.name} className="relative">
              <NavLink 
                to={link.path} 
                className={({ isActive }) => 
                  `text-sm font-medium transition-colors duration-300 ${
                    isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.name}
                    {isActive && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 w-8 h-1 bg-foreground rounded-full"></div>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative">
          <input type="text" placeholder="Type here to Search..." className="bg-secondary border border-border rounded-lg py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-64"/>
          <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="flex items-center space-x-5">
          <div className="relative">
            <Bell size={24} className="text-purple-400" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-background"></span>
          </div>
          <Settings size={22} className="text-muted-foreground hover:text-foreground cursor-pointer transition" />

          <div className="relative" ref={popupRef}>
            <img
              src={getAvatarUrl(user)}
              alt="User Avatar"
              className="h-9 w-9 rounded-full object-cover border-2 border-border cursor-pointer"
              onClick={() => setIsPopupOpen(!isPopupOpen)}
            />
            {isPopupOpen && <ProfilePopup user={user} onLogout={logout} />}
          </div>
          
        </div>
      </div>
    </nav>
  );
};

export default memo(Navbar);
