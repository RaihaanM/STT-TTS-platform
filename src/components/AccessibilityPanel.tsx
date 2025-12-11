
import React, { useEffect } from 'react';
import { XMarkIcon } from './icons';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    highContrast: boolean;
    setHighContrast: (val: boolean) => void;
    fontSize: 'normal' | 'large' | 'xl';
    setFontSize: (val: 'normal' | 'large' | 'xl') => void;
}

const AccessibilityPanel: React.FC<Props> = ({ 
    isOpen, onClose, highContrast, setHighContrast, fontSize, setFontSize 
}) => {
    
    // Apply styles to body
    useEffect(() => {
        if (highContrast) {
            document.documentElement.classList.add('high-contrast');
            document.body.style.filter = 'contrast(1.5)';
        } else {
            document.documentElement.classList.remove('high-contrast');
            document.body.style.filter = 'none';
        }
    }, [highContrast]);

    useEffect(() => {
        const root = document.documentElement;
        if (fontSize === 'normal') root.style.fontSize = '16px';
        if (fontSize === 'large') root.style.fontSize = '20px';
        if (fontSize === 'xl') root.style.fontSize = '24px';
    }, [fontSize]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800" aria-label="Close accessibility panel">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                
                <h2 className="text-2xl font-bold mb-6 text-slate-800">Accessibility</h2>

                <div className="space-y-6">
                    {/* Visual Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-700">Visuals</h3>
                        <div className="flex items-center justify-between">
                            <label htmlFor="hc-toggle" className="text-slate-600">High Contrast Mode</label>
                            <button 
                                id="hc-toggle"
                                onClick={() => setHighContrast(!highContrast)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${highContrast ? 'bg-green-600' : 'bg-slate-300'}`}
                            >
                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform ${highContrast ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div>
                            <label className="text-slate-600 block mb-2">Font Size</label>
                            <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                                {(['normal', 'large', 'xl'] as const).map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setFontSize(size)}
                                        className={`flex-1 py-2 rounded-md transition-colors capitalize ${fontSize === size ? 'bg-white text-green-700 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Shortcuts */}
                    <div className="pt-6 border-t border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Keyboard Shortcuts</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Translate</span>
                                <kbd className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-slate-600 font-mono">Alt + T</kbd>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Record</span>
                                <kbd className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-slate-600 font-mono">Alt + S</kbd>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Play Audio</span>
                                <kbd className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-slate-600 font-mono">Alt + P</kbd>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">History</span>
                                <kbd className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-slate-600 font-mono">Alt + H</kbd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessibilityPanel;
