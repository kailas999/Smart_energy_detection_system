import React from 'react';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-6">
      <header className="mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          AI Energy Leak Detection System
        </h1>
        <p className="text-gray-400 mt-2">Real-time monitoring of industrial machine power consumption over AI-powered Isolation Forest anomaly detection</p>
      </header>
      
      <main>
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
