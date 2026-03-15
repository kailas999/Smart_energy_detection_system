import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Leaf, Lightbulb, Zap, TrendingDown } from 'lucide-react';
import { AuthContext } from '../AuthContext';

const MetricCard = ({ icon: Icon, color, label, value, unit }) => (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '140px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: `${color}15`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Icon size={18} color={color} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </span>
        </div>
        <div>
            <span style={{ fontSize: '32px', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>{unit}</span>
        </div>
    </div>
);

const SustainabilityDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);

    useEffect(() => {
        const fetchSustainability = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/sustainability', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMetrics(response.data);
            } catch (error) {
                console.error("Sustainability fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSustainability();
        const interval = setInterval(fetchSustainability, 10000);
        return () => clearInterval(interval);
    }, [token]);

    if (loading) return (
        <div className="card" style={{ padding: '24px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Loading sustainability data...
        </div>
    );
    if (!metrics) return null;

    return (
        <div style={{ marginTop: '8px' }}>
            <div className="section-header">
                <Leaf size={14} color="#10b981" />
                Carbon Footprint &amp; Sustainability
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <MetricCard icon={Leaf} color="#10b981" label="CO₂ Emissions" value={metrics.carbon_footprint_kg.toFixed(2)} unit="kg CO₂" />
                <MetricCard icon={Zap} color="#3b82f6" label="Energy Used" value={metrics.energy_consumed_kwh.toFixed(2)} unit="kWh" />

                <div className="card" style={{ padding: '20px', flex: 2, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <Lightbulb size={16} color="#f59e0b" />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>AI Sustainability Tips</span>
                    </div>
                    <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {metrics.tips.map((tip, idx) => (
                            <li key={idx} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SustainabilityDashboard;
