import React, { useRef, useEffect } from 'react';
import { TranslationHistoryItem } from '../types';
import { ClockIcon, TrashIcon, XMarkIcon } from './icons';

interface HistoryPanelProps {
    isOpen: boolean;
    history: TranslationHistoryItem[];
    onClose: () => void;
    onSelect: (item: TranslationHistoryItem) => void;
    onDelete: (id: string) => void;
    onClearAll: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, history, onClose, onSelect, onDelete, onClearAll }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }

            if (event.key === 'Tab') {
                if (!panelRef.current) return;
                const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
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
        closeButtonRef.current?.focus();

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    return (
        <div 
            className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-hidden={!isOpen}
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-60" onClick={onClose}></div>

            {/* Panel */}
            <div ref={panelRef} className={`absolute inset-y-0 right-0 w-full max-w-md bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} border-l border-gray-700 flex flex-col`}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
                    <div className="flex items-center gap-3">
                        <ClockIcon className="h-6 w-6 text-purple-400" />
                        <h2 id="history-title" className="text-xl font-bold text-white">Translation History</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {history.length > 0 && (
                            <button 
                                onClick={onClearAll} 
                                className="text-sm px-3 py-1 bg-red-800/50 text-red-300 hover:bg-red-700/50 rounded-md transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                        <button ref={closeButtonRef} onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700" aria-label="Close history panel">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {history.length === 0 ? (
                        <div className="text-center text-gray-500 pt-10 flex flex-col items-center gap-4">
                            <ClockIcon className="h-12 w-12" />
                            <p>Your translation history will appear here.</p>
                        </div>
                    ) : (
                        <ul className='space-y-3'>
                            {history.map(item => (
                                <li key={item.id} className="bg-gray-900/50 rounded-lg group relative transition-colors">
                                    <button
                                        className="w-full text-left p-4 cursor-pointer hover:bg-gray-700/50 rounded-lg"
                                        onClick={() => onSelect(item)}
                                        aria-label={`Select translation from ${item.sourceLang.name} to ${item.targetLang.name}`}
                                    >
                                        <div className="mb-2">
                                            <p className="text-sm font-semibold text-gray-400">{item.sourceLang.name}</p>
                                            <p className="text-white line-clamp-2">{item.sourceText}</p>
                                        </div>
                                        <div className="border-t border-gray-700/50 my-2"></div>
                                        <div>
                                            <p className="text-sm font-semibold text-purple-400">{item.targetLang.name}</p>
                                            <p className="text-white line-clamp-2">{item.translatedText}</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                        className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-gray-700"
                                        aria-label="Delete this translation"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPanel;