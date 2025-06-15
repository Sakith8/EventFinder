import React from 'react';
import { Calendar } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">EventFinder</h1>
              <p className="text-sm text-gray-600">Discover. Connect. Experience.</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Browse Events
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Categories
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              About
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};