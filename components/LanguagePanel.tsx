
import React from 'react';
import { Language } from '../types';
import { INDIAN_LANGUAGES } from '../constants';
import { MicrophoneIcon, SpeakerWaveIcon, DocumentDuplicateIcon, StopCircleIcon } from './icons';

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
    placeholder
}) => {
    const handleLanguageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedLang = INDIAN_LANGUAGES.find(lang => lang.code === e.target.value);
        if (selectedLang) {
            onLanguageChange(selectedLang);
        }
    };

    const handleCopyToClipboard = () => {
        if(text) {
            navigator.clipboard.writeText(text);
        }
    };

    return (
        <div className="flex flex-col w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-2xl shadow-lg overflow-hidden h-[40vh] min-h-[300px] sm:h-[50vh] sm:min-h-[400px]">
            <div className="px-4 py-2 border-b border-gray-700">
                <select 
                    value={language.code} 
                    onChange={handleLanguageSelect}
                    className="bg-transparent text-white font-semibold focus:outline-none w-full"
                >
                    {INDIAN_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code} className="bg-gray-800 text-white">
                            {lang.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex-grow relative">
                <textarea
                    id={`${id}-textarea`}
                    value={text}
                    onChange={e => onTextChange && onTextChange(e.target.value)}
                    readOnly={isReadOnly}
                    placeholder={placeholder}
                    className="w-full h-full p-4 bg-transparent text-gray-200 resize-none focus:outline-none text-lg placeholder-gray-500"
                />
                {isLoading && (
                    <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 bg-gray-800/50">
                <div className="flex items-center gap-2">
                     {showRecordButton && (
                         <button 
                            onClick={onRecordToggle}
                            disabled={isRecording}
                            className={`p-2 rounded-full transition-colors duration-200 ${isRecording ? 'bg-red-600 cursor-not-allowed animate-pulse' : 'bg-gray-700 hover:bg-purple-600'}`}
                            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                         >
                            {isRecording ? <StopCircleIcon className="h-6 w-6" /> : <MicrophoneIcon className="h-6 w-6" />}
                         </button>
                     )}
                     <button
                        onClick={onPlayAudio}
                        disabled={!text || isPlayingAudio}
                        className="p-2 rounded-full bg-gray-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        aria-label="Play audio"
                     >
                        <SpeakerWaveIcon className={`h-6 w-6 ${isPlayingAudio ? 'text-purple-400 animate-pulse' : ''}`} />
                     </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{text.length}</span>
                    <button
                        onClick={handleCopyToClipboard}
                        disabled={!text}
                        className="p-2 rounded-full bg-gray-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
