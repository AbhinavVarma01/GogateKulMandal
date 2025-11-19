import { Home, Menu, Bell, User } from 'lucide-react';
import { Button } from './ui/button';

export function Header() {
  return (
    <header className="bg-gradient-to-r from-orange-100 to-amber-100 border-b border-orange-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-orange-900">GogateKulMandal</h1>
              <p className="text-sm text-orange-700">Family Heritage</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Button variant="ghost" className="text-orange-800 hover:text-orange-900 hover:bg-orange-50">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button variant="ghost" className="text-orange-800 hover:text-orange-900 hover:bg-orange-50">
              Heritage
            </Button>
            <Button variant="ghost" className="text-orange-800 hover:text-orange-900 hover:bg-orange-50">
              Genealogy
            </Button>
            <Button variant="ghost" className="text-orange-800 hover:text-orange-900 hover:bg-orange-50 bg-orange-100">
              News
            </Button>
            <Button variant="ghost" className="text-orange-800 hover:text-orange-900 hover:bg-orange-50">
              Gallery
            </Button>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-orange-700 hover:text-orange-900">
              <Bell className="w-5 h-5" />
            </Button>
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white">
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}