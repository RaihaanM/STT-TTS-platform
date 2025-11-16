import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language, TranslationHistoryItem } from './types';
import { SUPPORTED_LANGUAGES } from './constants';
import { translateText, textToSpeech } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audioUtils';
import LanguagePanel from './components/LanguagePanel';
import { ArrowsRightLeftIcon, Cog6ToothIcon, ClockIcon } from './components/icons';
import SettingsModal from './components/SettingsModal';
import OfflineIndicator from './components/OfflineIndicator';
import HistoryPanel from './components/HistoryPanel';

// Polyfill for webkitSpeechRecognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const HISTORY_STORAGE_KEY = 'app-translator-history';
const MAX_HISTORY_ITEMS = 50;

// Helper to find a language or return a fallback, ensuring we always have a valid language
const findLanguage = (code: string, fallbackName?: string): Language => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    if (lang) return lang;
    if (fallbackName) {
        const fallbackLang = SUPPORTED_LANGUAGES.find(l => l.name.includes(fallbackName));
        if (fallbackLang) return fallbackLang;
    }
    return SUPPORTED_LANGUAGES[0]; // Final fallback to the first language in the list
};

const App: React.FC = () => {
    const [sourceLang, setSourceLang] = useState<Language>(() => findLanguage('hi-IN', 'Hindi')); // Default to Hindi
    const [targetLang, setTargetLang] = useState<Language>(() => findLanguage('en-US', 'English')); // Default to English (US)
    const [sourceText, setSourceText] = useState<string>('');
    const [translatedText, setTranslatedText] = useState<string>('');
    const [isTranslating, setIsTranslating] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isPlayingSource, setIsPlayingSource] = useState<boolean>(false);
    const [isPlayingTarget, setIsPlayingTarget] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
    const [screenReaderMessage, setScreenReaderMessage] = useState<string>('');
    
    // Accessibility Settings
    const [volume, setVolume] = useState<number>(1);
    const [rate, setRate] = useState<number>(1);

    const recognitionRef = useRef<any | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const savedVolume = localStorage.getItem('app-translator-volume');
        const savedRate = localStorage.getItem('app-translator-rate');
        if (savedVolume) setVolume(parseFloat(savedVolume));
        if (savedRate) setRate(parseFloat(savedRate));

        try {
            const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error("Failed to load history from localStorage", e);
            setHistory([]);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    
    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        localStorage.setItem('app-translator-volume', newVolume.toString());
    };
    
    const handleRateChange = (newRate: number) => {
        setRate(newRate);
        localStorage.setItem('app-translator-rate', newRate.toString());
    };

    const initAudioContext = () => {
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                setError("Web Audio API is not supported by this browser.");
                console.error(e);
            }
        }
    };

    const handleTranslate = useCallback(async (text: string) => {
        if (isOffline) {
            setTranslatedText('');
            return;
        }
        if (!text.trim()) {
            setTranslatedText('');
            return;
        }
        setIsTranslating(true);
        setError(null);
        setScreenReaderMessage('Translation started.');
        try {
            const result = await translateText(text, sourceLang.name, targetLang.name);
            setTranslatedText(result);

            // Add to history
            const newHistoryItem: TranslationHistoryItem = {
                id: new Date().toISOString(),
                sourceLang,
                targetLang,
                sourceText: text,
                translatedText: result,
                timestamp: Date.now(),
            };

            setHistory(prevHistory => {
                const updatedHistory = [newHistoryItem, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
                try {
                    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
                } catch (e) {
                    console.error("Failed to save history to localStorage", e);
                }
                return updatedHistory;
            });

        } catch (err) {
            console.error(err);
            setError("Failed to translate. Please try again.");
            setTranslatedText('');
        } finally {
            setIsTranslating(false);
            setScreenReaderMessage('Translation complete.');
        }
    }, [sourceLang, targetLang, isOffline]);
    

    const handleSwapLanguages = () => {
        if (isOffline) return;
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setSourceText(translatedText);
        setTranslatedText(sourceText);
    };

    const handleToggleRecording = () => {
        initAudioContext();
        if (!SpeechRecognition) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }

        if (isRecording) {
            recognitionRef.current?.stop();
            return;
        }

        setIsRecording(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = sourceLang.code;
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                finalTranscript += event.results[i][0].transcript;
            }
            setSourceText(finalTranscript);
        };

        recognitionRef.current.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current.onerror = (event: any) => {
            setError(`Speech recognition error: ${event.error}`);
            setIsRecording(false);
        };
        
        recognitionRef.current.start();
    };
    
    const playAudioOffline = (text: string, langCode: string, setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>) => {
        if (!('speechSynthesis' in window)) {
            setError("Offline text-to-speech is not supported by this browser.");
            setIsPlaying(false);
            return;
        }

        window.speechSynthesis.cancel(); // Cancel any previous utterance

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.volume = volume;
        utterance.rate = rate;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = (event) => {
            console.error("SpeechSynthesis Error:", event);
            setError("An error occurred during offline speech synthesis.");
            setIsPlaying(false);
        };

        window.speechSynthesis.speak(utterance);
    };

    const playAudio = async (text: string, lang: Language, setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>) => {
        if (!text.trim() || isPlayingSource || isPlayingTarget) return;

        setIsPlaying(true);
        setError(null);
        
        if (isOffline) {
            playAudioOffline(text, lang.code, setIsPlaying);
            return;
        }

        initAudioContext();
        if (!audioContextRef.current) {
            setIsPlaying(false);
            return;
        }
        
        try {
            const audioData = await textToSpeech(text);
            const decodedData = decode(audioData);
            const audioBuffer = await decodeAudioData(decodedData, audioContextRef.current, 24000, 1);
            
            const sourceNode = audioContextRef.current.createBufferSource();
            const gainNode = audioContextRef.current.createGain();
            
            sourceNode.buffer = audioBuffer;
            gainNode.gain.value = volume;

            sourceNode.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);

            sourceNode.start();
            sourceNode.onended = () => setIsPlaying(false);

        } catch (err) {
            console.error(err);
            setError(`Failed to generate audio for ${lang.name}. Falling back to device voice.`);
            playAudioOffline(text, lang.code, setIsPlaying); // Fallback on API error
        }
    };

    const handleSelectHistoryItem = (item: TranslationHistoryItem) => {
        setSourceLang(item.sourceLang);
        setTargetLang(item.targetLang);
        setSourceText(item.sourceText);
        setTranslatedText(item.translatedText);
        setShowHistory(false); // Close panel after selection
    };

    const handleDeleteHistoryItem = (id: string) => {
        setHistory(prevHistory => {
            const updatedHistory = prevHistory.filter(item => item.id !== id);
            try {
                localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
            } catch (e) {
                console.error("Failed to save history to localStorage", e);
            }
            return updatedHistory;
        });
    };

    const handleClearHistory = () => {
        setHistory([]);
        try {
            localStorage.removeItem(HISTORY_STORAGE_KEY);
        } catch (e) {
            console.error("Failed to clear history from localStorage", e);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8 flex flex-col">
            <div className="sr-only" aria-live="polite">{screenReaderMessage}</div>
            <header className="text-center mb-6 relative">
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Polyglot India
                </h1>
                <p className="text-gray-400 mt-2 text-lg">AI-Powered Speech and Text Translation</p>
                <div className="absolute top-0 right-0 flex items-center gap-2">
                     <button
                        onClick={() => setShowHistory(true)}
                        className="p-2 rounded-full bg-gray-700/50 hover:bg-purple-600 transition-colors duration-200"
                        aria-label="Open translation history"
                    >
                        <ClockIcon className="h-6 w-6 text-white" />
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 rounded-full bg-gray-700/50 hover:bg-purple-600 transition-colors duration-200"
                        aria-label="Open accessibility settings"
                    >
                        <Cog6ToothIcon className="h-6 w-6 text-white" />
                    </button>
                </div>
            </header>
            
            {isOffline && <OfflineIndicator />}

            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6 text-center" role="alert">
                    <span className="block sm:inline">{error}</span>
                    <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close error message">
                        <svg className="fill-current h-6 w-6 text-red-400" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                    </button>
                </div>
            )}

            <main className="flex-grow flex flex-col lg:flex-row items-start justify-center gap-4 sm:gap-6">
                <LanguagePanel
                    id="source"
                    language={sourceLang}
                    onLanguageChange={setSourceLang}
                    text={sourceText}
                    onTextChange={setSourceText}
                    isRecording={isRecording}
                    onRecordToggle={handleToggleRecording}
                    onPlayAudio={() => playAudio(sourceText, sourceLang, setIsPlayingSource)}
                    isPlayingAudio={isPlayingSource}
                    isReadOnly={false}
                    isLoading={isTranslating} // Panel shows loading state during translation
                    showRecordButton={true}
                    placeholder="Enter text or use microphone..."
                    showTranslateButton={true}
                    onTranslate={() => handleTranslate(sourceText)}
                    isOffline={isOffline}
                />

                <div className="flex items-center justify-center w-full lg:w-auto my-2 lg:my-0">
                    <button
                        onClick={handleSwapLanguages}
                        disabled={isOffline}
                        className="p-3 rounded-full bg-gray-700 hover:bg-purple-600 transition-all duration-200 ease-in-out transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        aria-label="Swap languages"
                    >
                        <ArrowsRightLeftIcon className="h-6 w-6 text-white" />
                    </button>
                </div>

                <LanguagePanel
                    id="target"
                    language={targetLang}
                    onLanguageChange={setTargetLang}
                    text={translatedText}
                    onPlayAudio={() => playAudio(translatedText, targetLang, setIsPlayingTarget)}
                    isPlayingAudio={isPlayingTarget}
                    isReadOnly={true}
                    isLoading={isTranslating}
                    showRecordButton={false}
                    placeholder={isOffline ? "Translation is unavailable offline" : "Click 'Translate' to see the result..."}
                />
            </main>
            <HistoryPanel
                isOpen={showHistory}
                history={history}
                onClose={() => setShowHistory(false)}
                onSelect={handleSelectHistoryItem}
                onDelete={handleDeleteHistoryItem}
                onClearAll={handleClearHistory}
            />
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                volume={volume}
                onVolumeChange={handleVolumeChange}
                rate={rate}
                onRateChange={handleRateChange}
            />
        </div>
    );
};

export default App;