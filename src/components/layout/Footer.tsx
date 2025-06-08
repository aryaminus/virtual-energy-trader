import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-400">
            Virtual Energy Trader - Real CAISO market data simulation platform
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Built for Bolt Hackathon 2025 • Real CAISO market data via GridStatus API
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;