import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

const navigationItems = [
  {
    name: 'Market Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    name: 'Trading Interface',
    href: '/trading',
    icon: TrendingUp,
  },
  {
    name: 'Grid Analysis',
    href: '/analysis',
    icon: Zap,
  },
];

const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (location.pathname === '/' && item.href === '/dashboard');
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;