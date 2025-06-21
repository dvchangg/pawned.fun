import React from "react";
import { Link, useLocation } from "wouter";
import { useWallet } from "./WalletProvider";
import { Button } from "./ui/button";
import { Crown, User, Trophy, Gamepad2 } from "lucide-react";

export function Navigation() {
  const { connected, connect, disconnect, publicKey } = useWallet();
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Games", icon: Gamepad2 },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center space-x-2 text-xl font-bold">
              <Crown className="w-6 h-6 text-yellow-400" />
              <span>ChessLana</span>
            </div>
          </Link>

          <div className="flex items-center space-x-6">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} href={path}>
                <div
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location === path
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
              </Link>
            ))}

            {connected ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-white/70">
                  {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
                </span>
                <Button variant="outline" size="sm" onClick={disconnect}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={connect}>Connect Wallet</Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}