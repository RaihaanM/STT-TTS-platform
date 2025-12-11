
import React, { useMemo } from 'react';
import { metricsService } from '../services/metricsService';
import { XMarkIcon } from './icons';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const ResultsDashboard: React.FC<Props> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const metrics = metricsService.getMetrics();
    const evalResults = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('langlink-eval-results') || '[]');
        } catch {
            return [];
        }
    }, [isOpen]);

    // Aggregate Metrics
    const translationMetrics = metrics.filter(m => m.eventType === 'translation');
    const ttsMetrics = metrics.filter(m => m.eventType === 'tts');
    
    const avgTransLatency = translationMetrics.length 
        ? Math.round(translationMetrics.reduce((acc, m) => acc + m.latencyMs, 0) / translationMetrics.length) 
        : 0;
    
    const avgTTSLatency = ttsMetrics.length
        ? Math.round(ttsMetrics.reduce((acc, m) => acc + m.latencyMs, 0) / ttsMetrics.length)
        : 0;

    const avgRating = evalResults.length
        ? (evalResults.reduce((acc: number, r: any) => acc + r.rating, 0) / evalResults.length).toFixed(1)
        : 'N/A';

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full border border-slate-200 shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 transition-colors">
                    <XMarkIcon className="h-6 w-6" />
                </button>

                <h2 className="text-3xl font-bold mb-8 text-slate-800">
                    Performance Dashboard
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center shadow-sm">
                        <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Avg Translation Latency</span>
                        <span className="text-4xl font-bold text-slate-800">{avgTransLatency} <span className="text-lg text-slate-400 font-normal">ms</span></span>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center shadow-sm">
                        <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Avg TTS Latency</span>
                        <span className="text-4xl font-bold text-slate-800">{avgTTSLatency} <span className="text-lg text-slate-400 font-normal">ms</span></span>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center shadow-sm">
                        <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">User Quality Rating</span>
                        <span className="text-4xl font-bold text-green-600">{avgRating} <span className="text-lg text-slate-400 font-normal">/ 5</span></span>
                        <span className="block text-xs text-slate-400 mt-1">Samples: {evalResults.length}</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800">Live Latency Feed</h3>
                    <div className="h-48 flex items-end gap-1 bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-x-auto shadow-inner">
                        {translationMetrics.slice(0, 50).map((m, i) => (
                            <div 
                                key={m.id} 
                                className="w-3 bg-green-500 hover:bg-green-400 rounded-t transition-all relative group"
                                style={{ height: `${Math.min((m.latencyMs / 2000) * 100, 100)}%` }}
                            >
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-10 shadow-lg">
                                    {m.latencyMs}ms
                                </div>
                            </div>
                        ))}
                        {translationMetrics.length === 0 && <div className="text-slate-400 w-full text-center self-center italic">No requests logged yet</div>}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button 
                            onClick={() => {
                                metricsService.clearMetrics();
                                localStorage.removeItem('langlink-eval-results');
                                onClose();
                            }}
                            className="text-sm text-red-500 hover:text-red-700 font-medium"
                        >
                            Reset All Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultsDashboard;
