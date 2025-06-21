import React from 'react';
import { Link, useLocation } from 'wouter';
import { Crown, Home, Trophy, User } from 'lucide-react';

export function Navbar() {
  const [location] = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 text-white font-bold text-xl">
            <Crown className="w-8 h-8 text-yellow-400" />
            <span>ChessLana</span>
          </Link>
          
          <div className="flex space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-yellow-400 bg-yellow-400/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}