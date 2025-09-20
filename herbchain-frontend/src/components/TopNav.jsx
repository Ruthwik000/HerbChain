
import { Link, useLocation } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TopNav = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Farmer':
        return '🌱';
      case 'Lab':
        return '🧪';
      case 'Manufacturer':
        return '🏭';
      default:
        return '👤';
    }
  };

  const getNavLinks = (role) => {
    switch (role) {
      case 'Farmer':
        return [
          { path: '/farmer/dashboard', label: 'Dashboard' },
          { path: '/farmer/create-batch', label: 'Create Batch' },
          { path: '/farmer/my-batches', label: 'My Batches' }
        ];
      case 'Lab':
        return [
          { path: '/lab/dashboard', label: 'Dashboard' }
        ];
      case 'Manufacturer':
        return [
          { path: '/manufacturer/dashboard', label: 'Dashboard' }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks(user?.role);

  const isActiveLink = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/20 shadow-modern backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:shadow-xl group-hover:shadow-green-500/30 transition-all duration-300">
                <span className="text-white text-2xl">🌿</span>
              </div>
              <span className="ml-3 text-2xl font-bold gradient-text">HerbChain</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${isActiveLink(link.path) ? 'nav-link-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 px-4 py-2 bg-white/50 rounded-xl border border-white/20">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-lg">{getRoleIcon(user?.role)}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600 font-medium">{user?.role}</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-all duration-200"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  block px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActiveLink(link.path)
                    ? 'bg-green-100 text-green-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;