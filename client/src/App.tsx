import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch } from 'wouter';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { Navbar } from './components/Navbar';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Router>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/game/:id" component={GamePage} />
              <Route path="/leaderboard" component={LeaderboardPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route>
                <div className="text-center text-white">
                  <h1 className="text-2xl font-bold mb-4">404 - Page Not Found</h1>
                  <p>The page you're looking for doesn't exist.</p>
                </div>
              </Route>
            </Switch>
          </Router>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;