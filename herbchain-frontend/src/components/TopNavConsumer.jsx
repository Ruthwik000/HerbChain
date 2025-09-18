import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, QrCode, History, LogOut } from 'lucide-react';
import QRScanner from './QRScanner';

const TopNavConsumer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showQRScanner, setShowQRScanner] = useState(false);

  const navItems = [
    {
      path: '/consumer/trace',
      icon: Home,
      label: 'Home'
    },
    {
      path: '/consumer/trace',
      icon: QrCode,
      label: 'Scan QR',
      action: 'scan'
    },
    {
      path: '/consumer/history',
      icon: History,
      label: 'History'
    }
  ];

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const handleNavClick = (item, e) => {
    if (item.action === 'scan') {
      e.preventDefault();
      setShowQRScanner(true);
    }
  };

  const handleSwitchRole = () => {
    navigate('/auth/login');
  };

  return (
    <>
      <nav className="hidden md:block bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🌿</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">HerbChain</span>
              <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Consumer</span>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.action === 'scan' ? false : isActiveLink(item.path);
                const isTraceActive = item.action === 'scan' && location.pathname === '/consumer/trace';
                
                return (
                  <Link
                    key={item.path + item.label}
                    to={item.path}
                    onClick={(e) => handleNavClick(item, e)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200
                      ${isActive || isTraceActive
                        ? 'text-orange-600 bg-orange-50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Switch Role Button */}
            <button
              onClick={handleSwitchRole}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogOut size={16} />
              <span className="font-medium">Switch Role</span>
            </button>
          </div>
        </div>
      </nav>
      
      {/* QR Scanner Modal */}
      <QRScanner 
        isOpen={showQRScanner} 
        onClose={() => setShowQRScanner(false)} 
      />
    </>
  );
};

export default TopNavConsumer;