
import React, { useRef, useEffect } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    volume: number;
    onVolumeChange: (value: number) => void;
    rate: number;
    onRateChange: (value: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, volume, onVolumeChange, rate, onRateChange }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            // Tab logic...
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                ref={modalRef}
                className="bg-white text-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 id="settings-title" className="text-2xl font-bold text-green-600">Settings & Help</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close settings">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label htmlFor="volume-slider" className="block mb-2 text-lg text-slate-700 font-medium">
                            Speech Volume: <span className="font-bold text-green-600">{Math.round(volume * 100)}%</span>
                        </label>
                        <input
                            id="volume-slider"
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="rate-slider" className="block mb-2 text-lg text-slate-700 font-medium">
                            Speech Speed: <span className="font-bold text-green-600">{rate.toFixed(2)}x</span>
                        </label>
                        <input
                            id="rate-slider"
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={rate}
                            onChange={(e) => onRateChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 text-sm text-slate-500">
                    <h3 className="font-bold text-lg mb-2 text-slate-800">Quick Tips:</h3>
                    <ul className="list-disc list-inside space-y-2 marker:text-green-500">
                        <li>Use <kbd className="bg-slate-100 border border-slate-300 px-1 rounded font-mono text-xs">Alt + T</kbd> to translate instantly.</li>
                        <li>Use <kbd className="bg-slate-100 border border-slate-300 px-1 rounded font-mono text-xs">Alt + S</kbd> to toggle microphone.</li>
                        <li>Access history to review past conversations even when offline.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
