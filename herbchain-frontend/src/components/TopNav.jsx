
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
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🌿</span>
              </div>
              <span className="ml-2 text-xl font-bold text-green-800">HerbChain</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  px-3 py-2 text-sm font-medium transition-colors
                  ${isActiveLink(link.path)
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getRoleIcon(user?.role)}</span>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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