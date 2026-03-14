import React from 'react';
import { Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const isAnomaly = payload[0]?.payload?.isAnomaly;
    
    return (
      <div className={`bg-gray-800 p-4 rounded-xl border ${isAnomaly ? 'border-red-500/50 shadow-red-500/20' : 'border-gray-700'} shadow-xl`}>
        <p className="text-gray-300 mb-2 font-medium">{label}</p>
        {payload.map((entry, index) => {
          const anomalous = isAnomaly && entry.payload.anomalousMachines?.includes(entry.name);
          return (
            <p key={index} style={{ color: anomalous ? '#ef4444' : entry.color }} className="text-sm font-medium flex items-center justify-between gap-4">
              <span>{entry.name}</span>
              <span>{entry.value} W {anomalous && '⚠️'}</span>
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

const CustomizedDot = (props) => {
  const { cx, cy, payload, dataKey } = props;
  
  if (payload.isAnomaly && payload.anomalousMachines?.includes(dataKey)) {
    return (
      <circle cx={cx} cy={cy} r={5} stroke="rgba(239, 68, 68, 0.3)" strokeWidth={4} fill="#ef4444" />
    );
  }
  return null; 
};

const RealTimeChart = ({ data }) => {
  // Extract unique machine names for lines, ignoring metadata keys
  const machineNames = data.length > 0
    ? Object.keys(data[0]).filter(key => !['time', 'isAnomaly', 'anomalousMachines'].includes(key))
    : [];

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700 h-[450px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-100">Time-Series Energy Analysis</h2>
      </div>
      
      <div className="h-[350px] w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af" 
                tick={{fill: '#9ca3af', fontSize: 12}}
                tickMargin={10}
              />
              <YAxis 
                stroke="#9ca3af" 
                tick={{fill: '#9ca3af', fontSize: 12}}
                tickFormatter={(value) => `${value}W`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {machineNames.map((name, index) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={<CustomizedDot />}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
            <Activity className="animate-pulse mb-2 text-gray-600" size={32} />
            <p>Awaiting data stream... Start simulation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeChart;
