
import React from 'react';
import { XMarkIcon } from './icons';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    isOffline: boolean;
}

const OfflineCapabilityMatrix: React.FC<Props> = ({ isOpen, onClose, isOffline }) => {
    if (!isOpen) return null;

    const capabilities = [
        { feature: "Speech Recognition", online: "Full Accuracy", offline: "Limited/Device", status: isOffline ? "degraded" : "optimal" },
        { feature: "Text Translation", online: "Gemini 2.5 Flash", offline: "Unavailable", status: isOffline ? "unavailable" : "optimal" },
        { feature: "Text-to-Speech", online: "Gemini Natural Voice", offline: "Browser Synthesis", status: isOffline ? "degraded" : "optimal" },
        { feature: "History Access", online: "Available", offline: "Available", status: "optimal" },
        { feature: "Cached Translations", online: "Available", offline: "Available", status: "optimal" },
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                
                <h2 className="text-2xl font-bold mb-2 text-green-600">Offline Capability Matrix</h2>
                <p className="text-slate-500 mb-6">Current Network Status: <span className={isOffline ? "text-red-500 font-bold" : "text-green-600 font-bold"}>{isOffline ? "OFFLINE" : "ONLINE"}</span></p>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-3 text-slate-600 font-semibold">Feature</th>
                                <th className="p-3 text-slate-600 font-semibold">Online Mode</th>
                                <th className="p-3 text-slate-600 font-semibold">Offline Mode</th>
                                <th className="p-3 text-slate-600 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {capabilities.map((cap, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                                    <td className="p-3 font-medium text-slate-800">{cap.feature}</td>
                                    <td className="p-3 text-green-700">{cap.online}</td>
                                    <td className="p-3 text-amber-600">{cap.offline}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                            cap.status === 'optimal' ? 'bg-green-100 text-green-700' :
                                            cap.status === 'degraded' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {cap.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OfflineCapabilityMatrix;
