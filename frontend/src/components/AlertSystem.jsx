import React from 'react';
import { AlertTriangle, PowerOff, Activity, Zap, CheckCircle } from 'lucide-react';

const typeConfig = {
  'Hidden Leak': { icon: Activity, color: '#f59e0b', bg: '#422006', border: '#78350f' },
  'Phantom Load': { icon: PowerOff, color: '#a78bfa', bg: '#2e1065', border: '#5b21b6' },
  'Inefficiency Spike': { icon: Zap, color: '#fb7185', bg: '#3b0a18', border: '#7f1d2a' },
};

const AlertSystem = ({ anomalies }) => {
  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px', gap: '10px', textAlign: 'center' }}>
        <CheckCircle size={28} color="#10b981" />
        <div style={{ fontWeight: 600, fontSize: '14px', color: '#34d399' }}>All Systems Normal</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No anomalies detected in the last cycle</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {anomalies.map((anomaly, idx) => {
        const cfg = typeConfig[anomaly.type] || { icon: AlertTriangle, color: '#fb7185', bg: '#3b0a18', border: '#7f1d2a' };
        const Icon = cfg.icon;
        return (
          <div key={idx} className="fade-in" style={{
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={18} color={cfg.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: cfg.color }}>{anomaly.type || 'Anomaly'}</div>
                  <span style={{
                    fontSize: '11px', color: 'var(--text-secondary)',
                    background: '#ffffff10', border: '1px solid #ffffff15',
                    padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap', fontWeight: 500
                  }}>
                    {anomaly.machine_name}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.5 }}>
                  {anomaly.message || 'Unusual power consumption detected.'}
                </p>
              </div>
            </div>

            {anomaly.recommendation && (
              <div style={{
                background: '#ffffff08', border: '1px solid #ffffff10', borderRadius: '10px',
                padding: '10px 12px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#a3e635', marginBottom: '4px' }}>💡 AI Recommendation</div>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{anomaly.recommendation}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AlertSystem;
