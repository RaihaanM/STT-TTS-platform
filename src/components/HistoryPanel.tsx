
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
            // Tab trapping omitted for brevity but recommended
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
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>

            {/* Panel */}
            <div ref={panelRef} className={`absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} border-l border-slate-200 flex flex-col`}>
                <header className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <ClockIcon className="h-6 w-6 text-green-600" />
                        <h2 id="history-title" className="text-xl font-bold text-slate-800">Translation History</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {history.length > 0 && (
                            <button 
                                onClick={onClearAll} 
                                className="text-sm px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors font-medium"
                            >
                                Clear All
                            </button>
                        )}
                        <button ref={closeButtonRef} onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close history panel">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {history.length === 0 ? (
                        <div className="text-center text-slate-400 pt-10 flex flex-col items-center gap-4">
                            <ClockIcon className="h-12 w-12 opacity-50" />
                            <p>Your translation history will appear here.</p>
                        </div>
                    ) : (
                        <ul className='space-y-3'>
                            {history.map(item => (
                                <li key={item.id} className="bg-white border border-slate-100 shadow-sm hover:shadow-md rounded-xl group relative transition-all duration-200 hover:-translate-y-0.5">
                                    <button
                                        className="w-full text-left p-4 cursor-pointer rounded-xl"
                                        onClick={() => onSelect(item)}
                                        aria-label={`Select translation from ${item.sourceLang.name} to ${item.targetLang.name}`}
                                    >
                                        <div className="mb-2">
                                            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">{item.sourceLang.name}</p>
                                            <p className="text-slate-800 line-clamp-2 font-medium">{item.sourceText}</p>
                                        </div>
                                        <div className="border-t border-slate-100 my-2"></div>
                                        <div>
                                            <p className="text-xs font-bold uppercase text-green-600 tracking-wider mb-1">{item.targetLang.name}</p>
                                            <p className="text-slate-800 line-clamp-2">{item.translatedText}</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-50"
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
