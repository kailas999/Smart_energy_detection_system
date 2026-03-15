import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Heart, Wrench, ChevronUp, ChevronDown } from 'lucide-react';
import { AuthContext } from '../AuthContext';

const PredictiveHealthCard = ({ machineId, machineName }) => {
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);

    useEffect(() => {
        const fetchForecast = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/forecast/${machineId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setForecast(response.data);
            } catch (error) {
                console.error("Error fetching forecast:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchForecast();
        const interval = setInterval(fetchForecast, 15000);
        return () => clearInterval(interval);
    }, [machineId, token]);

    if (loading) return (
        <div style={{ marginTop: '12px', padding: '10px', borderRadius: '10px', background: '#0d1526', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Loading health data...
        </div>
    );
    if (!forecast) return null;

    const score = forecast.health_score;
    const scoreColor = score > 80 ? '#10b981' : score > 60 ? '#f59e0b' : '#f43f5e';
    const scoreBg = score > 80 ? '#10b98115' : score > 60 ? '#f59e0b15' : '#f43f5e15';
    const barWidth = `${score}%`;

    return (
        <div style={{
            marginTop: '12px',
            background: '#0d1526',
            border: `1px solid ${forecast.maintenance_recommended ? '#7f1d2a' : 'var(--border)'}`,
            borderRadius: '12px',
            padding: '12px',
            fontSize: '12px',
        }}>
            {forecast.maintenance_recommended && (
                <div style={{
                    background: '#7f1d2a', color: '#fca5a5',
                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
                    padding: '2px 8px', borderRadius: '4px', marginBottom: '10px', display: 'inline-block'
                }}>
                    ⚠ MAINTENANCE REQUIRED
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Heart size={12} color={scoreColor} /> Health Score
                </span>
                <span style={{ fontWeight: 700, color: scoreColor, fontSize: '14px' }}>
                    {score.toFixed(0)}<span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 400 }}>/100</span>
                </span>
            </div>

            {/* Progress bar */}
            <div style={{ background: '#ffffff10', borderRadius: '999px', height: '6px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{
                    width: barWidth,
                    height: '100%',
                    background: scoreColor,
                    borderRadius: '999px',
                    transition: 'width 0.6s ease',
                    boxShadow: `0 0 8px ${scoreColor}80`
                }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Wrench size={12} color="#60a5fa" /> Est. Days to Failure
                </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {forecast.estimated_days_to_failure}d
                </span>
            </div>
        </div>
    );
};

export default PredictiveHealthCard;
