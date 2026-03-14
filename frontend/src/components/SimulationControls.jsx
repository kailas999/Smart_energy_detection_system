import React from 'react';
import { Play, Square } from 'lucide-react';
import axios from 'axios';

const SimulationControls = ({ simulationState, setSimulationState }) => {
  const toggleSimulation = async (state) => {
    try {
      await axios.post(`http://localhost:8000/start-simulation?state=${state}`);
      setSimulationState(state);
    } catch (error) {
      console.error("Error toggling simulation:", error);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold mb-2">Virtual Sensor Generator</h2>
        <p className="text-gray-400 text-sm">
          Simulates persona-driven data (Student Laptops & Office Desktops)
        </p>
      </div>
      
      <div className="flex gap-4">
        {simulationState ? (
          <button 
            onClick={() => toggleSimulation(false)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <Square size={18} /> Stop Simulation
          </button>
        ) : (
          <button 
            onClick={() => toggleSimulation(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <Play size={18} /> Start Simulation
          </button>
        )}
      </div>
    </div>
  );
};

export default SimulationControls;
