import React from "react";
import { Router, Route, Switch } from "wouter";
import { WalletProvider } from "./components/WalletProvider";
import { Navigation } from "./components/Navigation";
import { HomePage } from "./pages/HomePage";
import { GamePage } from "./pages/GamePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { ProfilePage } from "./pages/ProfilePage";

function App() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Router>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/game/:id" component={GamePage} />
              <Route path="/leaderboard" component={LeaderboardPage} />
              <Route path="/profile" component={ProfilePage} />
            </Switch>
          </Router>
        </main>
      </div>
    </WalletProvider>
  );
}

export default App;