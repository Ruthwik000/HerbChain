import { Link, useLocation } from 'react-router-dom';
import { Home, Search, History } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/consumer/trace',
      icon: Home,
      label: 'Home'
    },
    {
      path: '/consumer/trace',
      icon: Search,
      label: 'Search'
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

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg md:hidden">
        <div className="flex justify-around items-center py-3 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveLink(item.path);
            
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={`
                  flex flex-col items-center py-2 px-3 min-w-0 flex-1 transition-all duration-200
                  ${isActive
                    ? 'text-orange-500' 
                    : 'text-gray-400 hover:text-gray-600'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-full transition-all duration-200
                  ${isActive
                    ? 'bg-orange-100' 
                    : 'hover:bg-gray-100'
                  }
                `}>
                  <Icon size={22} />
                </div>
                <span className={`
                  text-xs font-medium mt-1
                  ${isActive ? 'text-orange-500' : 'text-gray-500'}
                `}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;