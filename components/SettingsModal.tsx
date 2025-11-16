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
            if (event.key === 'Escape') {
                onClose();
            }

            if (event.key === 'Tab') {
                if (!modalRef.current) return;
                const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (event.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        event.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        event.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Focus the first element when the modal opens
        const firstFocusableElement = modalRef.current?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusableElement?.focus();

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
        >
            <div 
                ref={modalRef}
                className="bg-gray-800 text-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 border border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 id="settings-title" className="text-2xl font-bold text-purple-400">Accessibility & Help</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close settings">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label htmlFor="volume-slider" className="block mb-2 text-lg text-gray-300">
                            Speech Volume: <span className="font-semibold text-purple-300">{Math.round(volume * 100)}%</span>
                        </label>
                        <input
                            id="volume-slider"
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="rate-slider" className="block mb-2 text-lg text-gray-300">
                            Speech Speed: <span className="font-semibold text-purple-300">{rate.toFixed(2)}x</span>
                        </label>
                        <p className="text-sm text-gray-500 mb-2">Note: Speed adjustment works best with offline device voices.</p>
                        <input
                            id="rate-slider"
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={rate}
                            onChange={(e) => onRateChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-700 text-sm text-gray-400">
                    <h3 className="font-semibold text-lg mb-2 text-gray-300">How to use:</h3>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Select your source and target languages from the dropdowns.</li>
                        <li>Type text in the left panel or use the microphone icon to speak.</li>
                        <li>Click "Translate" to see the result in the right panel.</li>
                        <li>Use the speaker icons to listen to the text in either language.</li>
                        <li>Use the `Tab` key to navigate and `Enter` to activate buttons.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;