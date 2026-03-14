import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Zap, DollarSign, Server } from 'lucide-react';
import SimulationControls from './SimulationControls';
import RealTimeChart from './RealTimeChart';
import AlertSystem from './AlertSystem';

const Dashboard = () => {
  const [simulationState, setSimulationState] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [machineStatus, setMachineStatus] = useState([]);

  // Mock efficiency metrics mapped to power stats over time
  const [metrics, setMetrics] = useState({
    currentUsage: 0,
    dailyEfficiency: 92,
    estimatedSavings: 0
  });

  useEffect(() => {
    let interval;
    if (simulationState) {
      interval = setInterval(fetchInsights, 5000);
    }
    return () => clearInterval(interval);
  }, [simulationState]);

  const fetchInsights = async () => {
    try {
      const response = await axios.get('http://localhost:8000/insights');
      const data = response.data;
      
      setMachineStatus(data);
      
      let currentAnomalies = [];
      let totalPower = 0;
      let totalAnomalies = 0;
      
      const newChartPoint = {
        time: new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        isAnomaly: false, // Flag for specific time point
        anomalousMachines: [] // Which machines are anomalous
      };

      data.forEach(item => {
        if (item.sensor_data) {
          const power = item.sensor_data.power_consumption;
          newChartPoint[item.machine.name] = power;
          totalPower += power;
        }
        
        // Track anomalies from the last 15 seconds roughly 
        if (item.anomaly_data && item.anomaly_data.is_anomaly) {
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

      // Update metrics based on new data
      setMetrics(prev => ({
        currentUsage: Math.round(totalPower),
        dailyEfficiency: Math.max(0, 100 - (totalAnomalies * 2)), // arbitrary decay
        estimatedSavings: prev.estimatedSavings + Math.floor(Math.random() * 2) // mock incremental savings
      }));

      setChartData(prev => [...prev.slice(-19), newChartPoint]); // Keep last 20 points
      setAnomalies(currentAnomalies); 
      
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Header section with simulation controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <SimulationControls 
          simulationState={simulationState} 
          setSimulationState={setSimulationState} 
        />
        
        {/* Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow flex flex-col justify-center">
             <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-1">
               <Zap size={16} className="text-yellow-400" /> Current Usage (W)
             </div>
             <div className="text-3xl font-bold text-white">{metrics.currentUsage} <span className="text-lg text-gray-500 font-normal">W</span></div>
          </div>
          <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow flex flex-col justify-center">
             <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-1">
               <Activity size={16} className="text-emerald-400" /> Daily Efficiency (%)
             </div>
             <div className="text-3xl font-bold text-white">{metrics.dailyEfficiency} <span className="text-lg text-gray-500 font-normal">%</span></div>
          </div>
          <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow flex flex-col justify-center">
             <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-1">
               <DollarSign size={16} className="text-blue-400" /> Estimated Savings
             </div>
             <div className="text-3xl font-bold text-white"><span className="text-lg text-gray-500 font-normal">$</span>{metrics.estimatedSavings}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main View: Chart & Machines */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <RealTimeChart data={chartData} />
          
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-200 flex items-center gap-2"><Server size={18} /> Edge Device Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {machineStatus.length > 0 ? machineStatus.map((status, idx) => (
                 <div key={idx} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 flex flex-col">
                   <h3 className="font-medium text-blue-300 md:truncate mb-2" title={status.machine.name}>{status.machine.name}</h3>
                   <div className="flex items-center justify-between mt-auto text-sm">
                     <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${status.sensor_data?.state === 'Active' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-600/40 text-gray-400 border border-gray-600/50'}`}>
                        {status.sensor_data?.state || 'Unknown'}
                     </span>
                     <span className="font-mono text-gray-300">{status.sensor_data?.power_consumption || 0} W</span>
                   </div>
                   {status.sensor_data?.state === 'Idle' && (
                     <div className="text-xs text-gray-500 mt-2 text-right">
                       Idle duration: {status.sensor_data?.idle_duration || 0}s
                     </div>
                   )}
                 </div>
               )) : (
                 <p className="text-gray-500 text-sm col-span-full">Waiting for simulation data...</p>
               )}
            </div>
          </div>
        </div>
        
        {/* Action Sidebar: Alert Feed */}
        <div className="lg:col-span-1 border-l border-gray-800 pl-2 lg:pl-6 h-full">
          <div className="sticky top-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center justify-between text-gray-200">
               <span>Action Sidebar</span>
               {anomalies.length > 0 && (
                 <span className="flex h-3 w-3 relative">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                 </span>
               )}
            </h2>
            <AlertSystem anomalies={anomalies} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
