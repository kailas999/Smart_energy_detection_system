import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';

const AlertsPanel = ({ anomalies, machines }) => {
  if (anomalies.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 h-96 shadow-lg flex flex-col">
        <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
          <AlertCircle size={24} /> Leak Alerts
        </h2>
        <div className="flex-1 flex items-center justify-center text-gray-500 italic text-sm">
          No energy leaks detected yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 h-96 shadow-lg flex flex-col">
      <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2 border-b border-gray-700 pb-3">
        <AlertCircle size={24} /> Real-Time Energy Leaks
      </h2>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {anomalies.map((anomaly, idx) => {
          const machine = machines.find(m => m.id === anomaly.machine_id);
          const machineName = machine ? machine.name : `Machine-${anomaly.machine_id}`;
          const time = new Date(anomaly.timestamp).toLocaleTimeString();
          
          return (
            <div 
              key={anomaly.id || idx} 
              className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg flex flex-col gap-1 transition-all hover:bg-red-900/30"
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-red-400 text-sm">{machineName}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={12}/> {time}
                </span>
              </div>
              <div className="text-xs text-gray-300">
                Abnormal power consumption spike detected!
              </div>
              <div className="text-xs text-red-300 mt-1 font-mono">
                Severity Score: {anomaly.anomaly_score.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPanel;
