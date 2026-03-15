import React, { useState, useContext, useRef, useEffect } from 'react';
import axios from 'axios';
import { Mic, MicOff, Volume2, VolumeX, Send, Bot, User, Loader, X, Radio } from 'lucide-react';
import { AuthContext } from '../AuthContext';

const VoiceQnA = () => {
    const [command, setCommand] = useState('');
    const [messages, setMessages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isTtsEnabled, setIsTtsEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const { token } = useContext(AuthContext);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const messagesEndRef = useRef(null);
    const timerRef = useRef(null);
    const streamRef = useRef(null);
    const audioRef = useRef(null); // current playing HTMLAudioElement

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        return () => {
            stopAudio();
            stopRecording();
        };
    }, []);

    // Recording timer
    useEffect(() => {
        if (isRecording) {
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    /** ── Speak via Kokoro, fallback to browser TTS ─────────────── */
    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
    };

    const browserSpeak = (text) => {
        if (!window.speechSynthesis || !text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
            || voices.find(v => v.lang.startsWith('en'));
        if (voice) utterance.voice = voice;
        utterance.rate = 1.05;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const speakWithKokoro = async (text) => {
        if (!isTtsEnabled || !text.trim()) return;
        stopAudio();

        try {
            const controller = new AbortController();
            const response = await fetch('http://localhost:8000/api/speak', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ text, voice: 'af_heart', speed: 1.0 }),
                signal: controller.signal
            });

            if (!response.ok) throw new Error(`Kokoro TTS returned ${response.status}`);

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onplay = () => setIsSpeaking(true);
            audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
            audio.onerror = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(url);
                console.warn('[TTS] Audio play error, falling back to browser TTS');
                browserSpeak(text);
            };
            await audio.play();
        } catch (err) {
            console.warn('[TTS] Kokoro unavailable, using browser TTS fallback:', err.message);
            browserSpeak(text); // ← always falls back to browser TTS
        }
    };


    /** ── Send text command to AI ────────────────────────────────── */
    const sendCommand = async (text) => {
        if (!text.trim()) return;
        const userText = text.trim();
        const newMessages = [...messages, { sender: 'user', text: userText }];
        setMessages(newMessages);
        setCommand('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:8000/api/voice-command',
                { command: userText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const aiText = response.data.spoken_text || response.data.message;
            setMessages([...newMessages, {
                sender: 'ai', text: aiText,
                action: response.data.data,
                status: response.data.status
            }]);
            await speakWithKokoro(aiText);
        } catch (err) {
            const errMsg = 'Sorry, I encountered an error. Please try again.';
            setMessages([...newMessages, { sender: 'ai', text: errMsg, status: 'error' }]);
        } finally {
            setIsLoading(false);
        }
    };

    /** ── Whisper STT ────────────────────────────────────────────── */
    const transcribeAndSend = async (audioBlob) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const resp = await axios.post('http://localhost:8000/api/transcribe', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            const transcript = resp.data.transcript;
            if (transcript) {
                await sendCommand(transcript);
            } else {
                setMessages(prev => [...prev, {
                    sender: 'ai', text: "I couldn't hear you clearly. Please try again.", status: 'error'
                }]);
            }
        } catch (err) {
            console.error('Transcription error:', err);
            setMessages(prev => [...prev, {
                sender: 'ai', text: 'Whisper transcription failed. Please type your command instead.', status: 'error'
            }]);
        } finally {
            setIsTranscribing(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            audioChunksRef.current = [];

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(t => t.stop());
                await transcribeAndSend(audioBlob);
            };

            mediaRecorder.start(100);
            setIsRecording(true);
        } catch (err) {
            console.error('Mic error:', err);
            setMessages(prev => [...prev, {
                sender: 'ai', text: 'Microphone permission denied. Please allow mic access.', status: 'error'
            }]);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        streamRef.current?.getTracks().forEach(t => t.stop());
        setIsRecording(false);
    };

    const toggleRecording = () => isRecording ? stopRecording() : startRecording();

    const suggestions = [
        'What is the system status?',
        'How much power is being consumed?',
        'Are there any anomalies detected?',
        'Simulate anomaly on machine 1',
    ];

    const statusColor = { success: '#10b981', error: '#f43f5e', info: '#f59e0b' };
    const isProcessing = isLoading || isTranscribing;

    const statusLabel = isRecording
        ? `🔴 Recording ${recordingTime}s — press mic to stop`
        : isSpeaking ? '🔊 Kokoro speaking...'
            : isTranscribing ? '⚙ Whisper transcribing...'
                : isLoading ? '⏳ AI thinking...'
                    : '🎙 Whisper STT  ·  Kokoro TTS';

    return (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)',
                background: 'linear-gradient(90deg, #0f2040, #111827)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: isRecording
                            ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                            : isSpeaking
                                ? 'linear-gradient(135deg, #059669, #047857)'
                                : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isRecording ? '0 0 16px #dc262680' : isSpeaking ? '0 0 16px #05966980' : '0 0 12px #2563eb40',
                        animation: (isRecording || isSpeaking) ? 'pulse 1.2s infinite' : 'none',
                        transition: 'all 0.3s'
                    }}>
                        {isRecording ? <Radio size={14} color="#fff" /> : <Bot size={14} color="#fff" />}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>AI Voice Command Center</div>
                        <div style={{ fontSize: '11px', marginTop: '1px', color: isRecording ? '#f87171' : isSpeaking ? '#34d399' : isTranscribing ? '#f59e0b' : '#4b6080' }}>
                            {statusLabel}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {isSpeaking && (
                        <button onClick={stopAudio} style={{
                            background: '#0a2010', border: '1px solid #065f46', borderRadius: '8px',
                            padding: '5px 8px', cursor: 'pointer', color: '#34d399', fontSize: '11px',
                            display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif'
                        }}>
                            <VolumeX size={12} /> Stop
                        </button>
                    )}
                    <button
                        onClick={() => { setIsTtsEnabled(v => !v); if (isSpeaking) stopAudio(); }}
                        style={{
                            background: isTtsEnabled ? '#0a1f3d' : '#1a1f2e',
                            border: `1px solid ${isTtsEnabled ? '#2563eb' : 'var(--border)'}`,
                            borderRadius: '8px', padding: '5px 8px', cursor: 'pointer',
                            color: isTtsEnabled ? '#60a5fa' : '#4b6080', fontSize: '11px',
                            display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Inter, sans-serif'
                        }}
                    >
                        {isTtsEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                        {isTtsEnabled ? 'Kokoro On' : 'Kokoro Off'}
                    </button>
                    {messages.length > 0 && (
                        <button onClick={() => { setMessages([]); stopAudio(); }} style={{
                            background: 'none', border: 'none', color: '#4b6080', cursor: 'pointer', padding: '5px'
                        }}>
                            <X size={13} />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.length === 0 && !isRecording && (
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '10px' }}>
                            Press mic → speak → press mic again to transcribe via Whisper
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {suggestions.map((s, i) => (
                                <button key={i} onClick={() => sendCommand(s)} style={{
                                    background: '#0d1526', border: '1px solid var(--border)', borderRadius: '8px',
                                    padding: '8px 12px', fontSize: '12px', color: 'var(--text-secondary)',
                                    cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s'
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#93c5fd'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                >✦ {s}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recording waveform */}
                {isRecording && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                        padding: '20px', background: '#1a0d0d', border: '1px solid #7f1d2a', borderRadius: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '32px' }}>
                            {[...Array(14)].map((_, i) => (
                                <div key={i} style={{
                                    width: '4px', background: '#f43f5e', borderRadius: '2px', minHeight: '4px',
                                    animation: `waveBar${i % 4} 0.6s ${i * 0.05}s ease-in-out infinite alternate`
                                }} />
                            ))}
                        </div>
                        <div style={{ fontSize: '13px', color: '#f87171', fontWeight: 600 }}>
                            Recording {recordingTime}s…
                        </div>
                    </div>
                )}

                {/* Transcribing indicator */}
                {isTranscribing && (
                    <div className="fade-in" style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                        background: '#1a1500', border: '1px solid #78350f', borderRadius: '12px',
                        fontSize: '13px', color: '#fcd34d'
                    }}>
                        <Loader size={14} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                        Whisper is transcribing your voice…
                    </div>
                )}

                {/* Messages */}
                {messages.map((msg, idx) => (
                    <div key={idx} className="fade-in" style={{
                        display: 'flex', gap: '8px', alignItems: 'flex-start',
                        flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                    }}>
                        <div style={{
                            width: '26px', height: '26px', borderRadius: '7px', flexShrink: 0,
                            background: msg.sender === 'user' ? '#2563eb' : 'linear-gradient(135deg, #059669, #2563eb)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {msg.sender === 'user' ? <User size={13} color="#fff" /> : <Bot size={13} color="#fff" />}
                        </div>
                        <div style={{
                            maxWidth: '86%',
                            background: msg.sender === 'user' ? '#1e3a5f' : '#0d1a10',
                            border: `1px solid ${msg.sender === 'user' ? '#2563eb40' : msg.status ? (statusColor[msg.status] + '40') : '#10b98130'}`,
                            borderRadius: msg.sender === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                            padding: '10px 12px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5
                        }}>
                            {msg.text}
                            {msg.action && msg.action.action && msg.action.action !== 'unknown' && msg.action.action !== 'error' && (
                                <div style={{ marginTop: '6px', fontSize: '11px', color: '#a3e635' }}>
                                    ⚙ {msg.action.action}{msg.action.machine_id ? ` · machine ${msg.action.machine_id}` : ''}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Loading dots */}
                {isLoading && !isTranscribing && (
                    <div className="fade-in" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'linear-gradient(135deg, #059669, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bot size={13} color="#fff" />
                        </div>
                        <div style={{ background: '#0d1a10', border: '1px solid #10b98130', borderRadius: '4px 12px 12px 12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Thinking…
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input row */}
            <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
                <form onSubmit={(e) => { e.preventDefault(); sendCommand(command); }}
                    style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder={isRecording ? '🔴 Recording — press mic to stop & transcribe…' : 'Type or press mic (Whisper)…'}
                        className="input-field"
                        style={{ flex: 1, padding: '9px 12px', fontSize: '13px', opacity: isRecording ? 0.5 : 1 }}
                        disabled={isRecording || isProcessing}
                    />
                    {/* Mic button */}
                    <button type="button" onClick={toggleRecording} disabled={isProcessing}
                        title={isRecording ? 'Stop & transcribe' : 'Record voice (Whisper STT)'}
                        style={{
                            width: '40px', height: '40px', borderRadius: '10px', border: 'none', flexShrink: 0,
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            background: isRecording ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : '#1e2d45',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: isRecording ? '0 0 16px #dc262660' : 'none',
                            animation: isRecording ? 'pulse 1.5s infinite' : 'none', transition: 'all 0.2s'
                        }}>
                        {isRecording ? <MicOff size={17} color="#fff" /> : <Mic size={17} color="#60a5fa" />}
                    </button>
                    {/* Send button */}
                    <button type="submit" disabled={!command.trim() || isProcessing}
                        style={{
                            width: '40px', height: '40px', borderRadius: '10px', border: 'none', flexShrink: 0,
                            cursor: command.trim() && !isProcessing ? 'pointer' : 'not-allowed',
                            background: command.trim() && !isProcessing ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#1e2d45',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                        }}>
                        <Send size={15} color={command.trim() && !isProcessing ? '#fff' : '#4b6080'} />
                    </button>
                </form>

                {/* Pipeline legend */}
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#2a3a56' }}>
                    <span>🎙 Mic</span><span>→</span>
                    <span style={{ color: '#3b82f620' }}>Whisper STT</span><span>→</span>
                    <span>LLM</span><span>→</span>
                    <span>FastAPI</span><span>→</span>
                    <span style={{ color: '#10b98140' }}>Kokoro TTS</span>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes waveBar0 { from{height:4px} to{height:28px} }
                @keyframes waveBar1 { from{height:6px} to{height:20px} }
                @keyframes waveBar2 { from{height:8px} to{height:24px} }
                @keyframes waveBar3 { from{height:4px} to{height:16px} }
            `}</style>
        </div>
    );
};

export default VoiceQnA;
