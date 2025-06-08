import React from 'react';
import { Zap } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-lg border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 p-2 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Virtual Energy Trader</h1>
              <p className="text-sm text-gray-600">CAISO Market Simulator</p>
            </div>
          </div>
          
          {/* Built on Bolt Badge */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            ⚡ Built on Bolt
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;