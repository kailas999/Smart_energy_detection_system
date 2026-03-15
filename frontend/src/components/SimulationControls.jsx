import React, { useContext } from 'react';
import { Play, Square, Cpu } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

const SimulationControls = ({ simulationState, setSimulationState }) => {
  const { token } = useContext(AuthContext);

  const toggleSimulation = async (state) => {
    try {
      await axios.post(`http://localhost:8000/start-simulation?state=${state}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSimulationState(state);
    } catch (error) {
      console.error("Error toggling simulation:", error);
    }
  };

  return (
    <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '12px',
          background: simulationState ? 'linear-gradient(135deg, #059669, #047857)' : 'var(--bg-secondary)',
          border: `1px solid ${simulationState ? '#059669' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s',
          boxShadow: simulationState ? '0 0 16px #05966940' : 'none'
        }}>
          <Cpu size={20} color={simulationState ? '#fff' : '#4b6080'} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>Virtual Sensor Generator</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {simulationState
              ? <span style={{ color: '#34d399' }}>● Simulating · Student Laptops &amp; Office Desktops</span>
              : 'Start to generate live sensor data from virtual machines'}
          </div>
        </div>
      </div>

      {simulationState ? (
        <button
          onClick={() => toggleSimulation(false)}
          className="btn-danger"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
        >
          <Square size={15} /> Stop Simulation
        </button>
      ) : (
        <button
          onClick={() => toggleSimulation(true)}
          className="btn-success"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
        >
          <Play size={15} /> Start Simulation
        </button>
      )}
    </div>
  );
};

export default SimulationControls;
