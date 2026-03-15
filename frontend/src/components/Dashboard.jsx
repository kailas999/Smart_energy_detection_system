import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Zap, Activity, DollarSign, Server, Bell, Cpu, Bot } from 'lucide-react';
import SimulationControls from './SimulationControls';
import RealTimeChart from './RealTimeChart';
import AlertSystem from './AlertSystem';
import PredictiveHealthCard from './PredictiveHealthCard';
import SustainabilityDashboard from './SustainabilityDashboard';
import VoiceQnA from './VoiceQnA';
import { AuthContext } from '../AuthContext';

const StatCard = ({ icon: Icon, iconColor, label, value, unit }) => (
  <div className="card fade-in" style={{ padding: '18px 20px', flex: 1, minWidth: '150px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '8px' }}>
      <Icon size={14} color={iconColor} />
      {label}
    </div>
    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
      {value}
      <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '4px' }}>{unit}</span>
    </div>
  </div>
);

const Dashboard = () => {
  const [simulationState, setSimulationState] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [machineStatus, setMachineStatus] = useState([]);
  const [metrics, setMetrics] = useState({ currentUsage: 0, dailyEfficiency: 92, estimatedSavings: 0 });
  const { token } = useContext(AuthContext);

  useEffect(() => {
    let interval;
    if (simulationState) {
      interval = setInterval(fetchInsights, 5000);
    }
    return () => clearInterval(interval);
  }, [simulationState]);

  const fetchInsights = async () => {
    try {
      const response = await axios.get('http://localhost:8000/insights', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      setMachineStatus(data);

      let currentAnomalies = [], totalPower = 0, totalAnomalies = 0;
      const newChartPoint = {
        time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isAnomaly: false,
        anomalousMachines: []
      };

      data.forEach(item => {
        if (item.sensor_data) {
          newChartPoint[item.machine.name] = item.sensor_data.power_consumption;
          totalPower += item.sensor_data.power_consumption;
        }
        if (item.anomaly_data?.is_anomaly) {
          totalAnomalies += 1;
          newChartPoint.isAnomaly = true;
          newChartPoint.anomalousMachines.push(item.machine.name);
          currentAnomalies.push({
            machine_name: item.machine.name,
            type: item.anomaly_data.anomaly_type,
            score: item.anomaly_data.anomaly_score,
            message: item.anomaly_data.alert_message,
            recommendation: item.anomaly_data.recommendation
          });
        }
      });

      setMetrics(prev => ({
        currentUsage: Math.round(totalPower),
        dailyEfficiency: Math.max(0, 100 - (totalAnomalies * 2)),
        estimatedSavings: prev.estimatedSavings + Math.floor(Math.random() * 2)
      }));
      setChartData(prev => [...prev.slice(-19), newChartPoint]);
      setAnomalies(currentAnomalies);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Row 1: Simulation Controls + Stat Cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'stretch' }}>
        <div style={{ flex: '2', minWidth: '280px' }}>
          <SimulationControls simulationState={simulationState} setSimulationState={setSimulationState} />
        </div>
        <div style={{ display: 'flex', gap: '12px', flex: '3', minWidth: '300px', flexWrap: 'wrap' }}>
          <StatCard icon={Zap} iconColor="#f59e0b" label="Current Usage" value={metrics.currentUsage} unit="W" />
          <StatCard icon={Activity} iconColor="#10b981" label="Daily Efficiency" value={metrics.dailyEfficiency} unit="%" />
          <StatCard icon={DollarSign} iconColor="#3b82f6" label="Est. Savings" value={`$${metrics.estimatedSavings}`} unit="" />
        </div>
      </div>

      {/* Row 2: Main content + Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* Left: Chart + Machines + Sustainability */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="#3b82f6" />
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Time-Series Energy Analysis</span>
            </div>
            <div style={{ padding: '16px' }}>
              <RealTimeChart data={chartData} />
            </div>
          </div>

          {/* Machine Status Grid */}
          <div>
            <div className="section-header">
              <Server size={13} />
              Edge Device Status
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {machineStatus.length > 0 ? machineStatus.map((status, idx) => {
                const isActive = status.sensor_data?.state === 'Active';
                const isAnomalous = anomalies.some(a => a.machine_name === status.machine?.name);
                return (
                  <div key={idx} className="card fade-in" style={{
                    padding: '16px',
                    borderColor: isAnomalous ? '#f43f5e60' : 'var(--border)',
                    boxShadow: isAnomalous ? '0 0 16px #f43f5e15' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '3px' }}>
                          {status.machine?.name || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Machine ID: {status.machine?.id}
                        </div>
                      </div>
                      <span className={`stat-badge ${isAnomalous ? 'status-anomaly' : isActive ? 'status-active' : 'status-idle'}`}>
                        {isAnomalous ? '● Alert' : isActive ? '● Active' : '● Idle'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Power Draw</span>
                      <span style={{ fontWeight: 700, fontSize: '18px', color: isAnomalous ? '#fb7185' : 'var(--text-primary)' }}>
                        {status.sensor_data?.power_consumption || 0}<span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '3px' }}>W</span>
                      </span>
                    </div>

                    {status.sensor_data?.state === 'Idle' && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Idle: {status.sensor_data?.idle_duration || 0}s
                      </div>
                    )}

                    <PredictiveHealthCard machineId={status.machine?.id} machineName={status.machine?.name} />
                  </div>
                );
              }) : (
                <div className="card" style={{ padding: '24px', gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <Cpu size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                  Start the simulation to see device data
                </div>
              )}
            </div>
          </div>

          {/* Advanced Control Center */}
          <div>
            <div className="section-header">
              <Bot size={13} color="#7c3aed" />
              Advanced Control Center
            </div>
            <VoiceQnA />
          </div>

          <SustainabilityDashboard />
        </div>

        {/* Right Sidebar: Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'sticky', top: '84px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div className="section-header" style={{ marginBottom: 0, flex: 1 }}>
              <Bell size={13} />
              Live Alerts
            </div>
            {anomalies.length > 0 && (
              <span style={{
                background: '#f43f5e', color: '#fff', fontSize: '11px', fontWeight: 700,
                width: '20px', height: '20px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {anomalies.length}
              </span>
            )}
          </div>
          <AlertSystem anomalies={anomalies} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
