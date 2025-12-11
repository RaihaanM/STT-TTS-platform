
import React from 'react';
import { Language } from '../types';
import { SUPPORTED_LANGUAGES } from '../constants';
import { MicrophoneIcon, SpeakerWaveIcon, DocumentDuplicateIcon, StopCircleIcon, PaperAirplaneIcon } from './icons';

interface LanguagePanelProps {
    id: 'source' | 'target';
    language: Language;
    onLanguageChange: (lang: Language) => void;
    text: string;
    onTextChange?: (text: string) => void;
    isReadOnly: boolean;
    isLoading: boolean;
    isRecording?: boolean;
    onRecordToggle?: () => void;
    onPlayAudio: () => void;
    isPlayingAudio: boolean;
    showRecordButton: boolean;
    placeholder: string;
    showTranslateButton?: boolean;
    onTranslate?: () => void;
    isOffline?: boolean;
}

const LanguagePanel: React.FC<LanguagePanelProps> = ({
    id,
    language,
    onLanguageChange,
    text,
    onTextChange,
    isReadOnly,
    isLoading,
    isRecording,
    onRecordToggle,
    onPlayAudio,
    isPlayingAudio,
    showRecordButton,
    placeholder,
    showTranslateButton,
    onTranslate,
    isOffline,
}) => {
    const handleLanguageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedLang = SUPPORTED_LANGUAGES.find(lang => lang.code === e.target.value);
        if (selectedLang) {
            onLanguageChange(selectedLang);
        }
    };

    const handleCopyToClipboard = () => {
        if(text) {
            navigator.clipboard.writeText(text);
        }
    };

    const isTargetPanel = id === 'target';

    return (
        <div 
            className="flex flex-col w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden h-[40vh] min-h-[300px] sm:h-[50vh] sm:min-h-[400px] transition-shadow duration-300 hover:shadow-2xl"
            aria-live={isTargetPanel ? "polite" : undefined}
            aria-busy={isLoading}
        >
            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                <select 
                    value={language.code} 
                    onChange={handleLanguageSelect}
                    className="bg-transparent text-slate-800 font-bold focus:outline-none w-full py-1"
                    aria-label={`Select language for ${id} panel`}
                >
                    {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code} className="bg-white text-slate-800">
                            {lang.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex-grow relative bg-white">
                <textarea
                    id={`${id}-textarea`}
                    value={text}
                    onChange={e => onTextChange && onTextChange(e.target.value)}
                    readOnly={isReadOnly}
                    placeholder={placeholder}
                    className="w-full h-full p-6 bg-transparent text-slate-800 resize-none focus:outline-none text-xl sm:text-2xl placeholder-slate-300 font-medium leading-relaxed"
                />
                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" role="status" aria-label="Translating..."></div>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                     {showRecordButton && (
                         <button 
                            onClick={onRecordToggle}
                            className={`p-2 rounded-full transition-colors duration-200 ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-red-200 shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500'}`}
                            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                         >
                            {isRecording ? <StopCircleIcon className="h-6 w-6" /> : <MicrophoneIcon className="h-6 w-6" />}
                         </button>
                     )}
                     <button
                        onClick={onPlayAudio}
                        disabled={!text || isPlayingAudio}
                        className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        aria-label="Play audio"
                     >
                        <SpeakerWaveIcon className={`h-6 w-6 ${isPlayingAudio ? 'text-green-600 animate-pulse' : ''}`} />
                     </button>
                </div>
                
                <div className="flex items-center gap-2">
                     {showTranslateButton && (
                        <button
                            onClick={onTranslate}
                            disabled={!text || isLoading || isOffline}
                            className="flex items-center gap-2 px-5 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            aria-label="Translate text"
                        >
                            <PaperAirplaneIcon className="h-5 w-5" />
                            <span>Translate</span>
                        </button>
                     )}
                    <span className="text-sm text-slate-400 font-medium">{text.length}<span className="sr-only"> characters</span></span>
                    <button
                        onClick={handleCopyToClipboard}
                        disabled={!text}
                        className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        aria-label="Copy to clipboard"
                    >
                        <DocumentDuplicateIcon className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LanguagePanel;
