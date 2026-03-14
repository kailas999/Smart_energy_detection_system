import React from 'react';
import { AlertTriangle, PowerOff, Activity, Zap } from 'lucide-react';

const getIcon = (type) => {
  switch(type) {
    case 'Hidden Leak': return <Activity className="text-amber-500" />;
    case 'Phantom Load': return <PowerOff className="text-purple-500" />;
    case 'Inefficiency Spike': return <Zap className="text-rose-500" />;
    default: return <AlertTriangle className="text-red-500" />;
  }
};

const getBorderColor = (type) => {
  switch(type) {
    case 'Hidden Leak': return 'border-amber-500/50';
    case 'Phantom Load': return 'border-purple-500/50';
    case 'Inefficiency Spike': return 'border-rose-500/50';
    default: return 'border-red-500/50';
  }
};

const AlertSystem = ({ anomalies }) => {
  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-emerald-500/30 flex justify-center items-center h-full min-h-[150px]">
        <p className="text-emerald-400 font-medium">No Anomalies Detected. System Normal.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {anomalies.map((anomaly, idx) => (
        <div key={idx} className={`bg-gray-800 p-5 rounded-xl shadow-lg border ${getBorderColor(anomaly.type)} relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-current to-transparent" style={{ color: getBorderColor(anomaly.type).split('-')[1] }}></div>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-900 rounded-lg">
              {getIcon(anomaly.type)}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-lg">{anomaly.type || "Unknown Anomaly"}</h3>
                <span className="text-xs bg-gray-900 px-2 py-1 rounded-md text-gray-400 font-mono">
                  Machine: {anomaly.machine_name}
                </span>
              </div>
              
              <p className="text-gray-300 text-sm mb-3">
                {anomaly.message || "Unusual power consumption patterns detected."}
              </p>
              
              {anomaly.recommendation && (
                <div className="bg-gray-900/50 px-4 py-3 rounded-lg border border-gray-700 mt-2">
                  <p className="text-sm font-medium text-emerald-300 flex items-center gap-2">
                    💡 Recommendation:
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {anomaly.recommendation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertSystem;
