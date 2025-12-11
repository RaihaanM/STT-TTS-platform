
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language, TranslationHistoryItem } from './types';
import { SUPPORTED_LANGUAGES } from './constants';
import { translateText, textToSpeech } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audioUtils';
import { metricsService } from './services/metricsService';
import { optimizationService } from './services/optimizationService';
import LanguagePanel from './components/LanguagePanel';
import { ArrowsRightLeftIcon, Cog6ToothIcon, ClockIcon } from './components/icons';
import SettingsModal from './components/SettingsModal';
import OfflineIndicator from './components/OfflineIndicator';
import HistoryPanel from './components/HistoryPanel';
import OfflineCapabilityMatrix from './components/OfflineCapabilityMatrix';
import EvaluationRunner from './components/EvaluationRunner';
import ResultsDashboard from './components/ResultsDashboard';
import AccessibilityPanel from './components/AccessibilityPanel';

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
    
    // UI Panels State
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [showMatrix, setShowMatrix] = useState<boolean>(false);
    const [showEval, setShowEval] = useState<boolean>(false);
    const [showDashboard, setShowDashboard] = useState<boolean>(false);
    const [showAccessibility, setShowAccessibility] = useState<boolean>(false);

    const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
    const [screenReaderMessage, setScreenReaderMessage] = useState<string>('');
    
    // Accessibility Settings
    const [volume, setVolume] = useState<number>(1);
    const [rate, setRate] = useState<number>(1);
    const [highContrast, setHighContrast] = useState<boolean>(false);
    const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('normal');

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

    const handleTranslate = useCallback(async (text: string, overrideTargetLangName?: string) => {
        if (isOffline) {
            setTranslatedText('');
            return '';
        }
        if (!text.trim()) {
            setTranslatedText('');
            return '';
        }
        
        const targetLanguageName = overrideTargetLangName || targetLang.name;
        
        // 1. Check Cache
        const cached = optimizationService.getCachedTranslation(text, sourceLang.name, targetLanguageName);
        if (cached) {
            setTranslatedText(cached);
            setScreenReaderMessage('Translation loaded from cache.');
            return cached;
        }

        setIsTranslating(true);
        setError(null);
        setScreenReaderMessage('Translation started.');
        
        try {
            // 2. Measure Latency via Metrics Service
            const { result } = await metricsService.measureStageLatency('translation', async () => {
                return await translateText(text, sourceLang.name, targetLanguageName);
            });

            setTranslatedText(result);
            
            // 3. Save to Cache
            optimizationService.setCachedTranslation(text, sourceLang.name, targetLanguageName, result);

            // 4. Add to history
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
            
            return result;

        } catch (err) {
            console.error(err);
            setError("Failed to translate. Please try again.");
            setTranslatedText('');
            return '';
        } finally {
            setIsTranslating(false);
            setScreenReaderMessage('Translation complete.');
        }
    }, [sourceLang, targetLang, isOffline]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.altKey) {
                switch(e.key.toLowerCase()) {
                    case 't': // Translate
                        if (sourceText) handleTranslate(sourceText);
                        break;
                    case 's': // Speak/Record
                        handleToggleRecording();
                        break;
                    case 'p': // Play result
                        if (translatedText) playAudio(translatedText, targetLang, setIsPlayingTarget);
                        break;
                    case 'h': // History
                        setShowHistory(prev => !prev);
                        break;
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [sourceText, translatedText, targetLang]);
    

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
        metricsService.logEvent('stt', 0, { status: 'started' }); // Log start
        
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = sourceLang.code;
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        const startTime = performance.now();

        recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                finalTranscript += event.results[i][0].transcript;
            }
            setSourceText(finalTranscript);
        };

        recognitionRef.current.onend = () => {
            setIsRecording(false);
            const endTime = performance.now();
            metricsService.logEvent('stt', Math.round(endTime - startTime), { textLength: sourceText.length });
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
            await metricsService.measureStageLatency('tts', async () => {
                const audioData = await textToSpeech(text);
                const decodedData = decode(audioData);
                const audioBuffer = await decodeAudioData(decodedData, audioContextRef.current!, 24000, 1);
                
                const sourceNode = audioContextRef.current!.createBufferSource();
                const gainNode = audioContextRef.current!.createGain();
                
                sourceNode.buffer = audioBuffer;
                gainNode.gain.value = volume;

                sourceNode.connect(gainNode);
                gainNode.connect(audioContextRef.current!.destination);

                sourceNode.start();
                sourceNode.onended = () => setIsPlaying(false);
                return true;
            });

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
        <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-8 flex flex-col transition-colors duration-200 bg-slate-50 text-slate-900">
            <div className="sr-only" aria-live="polite">{screenReaderMessage}</div>
            <header className="mb-6 relative">
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500 pb-1">
                        LangLink
                    </h1>
                    <p className="text-gray-600 mt-2 text-lg">SpeakEasy - Research Grade Translator</p>
                </div>
                
                <div className="absolute top-0 right-0 flex items-center gap-2">
                     <button
                        onClick={() => setShowAccessibility(true)}
                        className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-green-50 hover:text-green-700 text-gray-700 transition-colors duration-200"
                        title="Accessibility"
                    >
                        <span className="font-bold px-1">Aa</span>
                    </button>
                     <button
                        onClick={() => setShowMatrix(true)}
                        className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-green-50 hover:text-green-700 text-gray-700 transition-colors duration-200"
                        title="Offline Capabilities"
                    >
                         <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
                    </button>
                     <button
                        onClick={() => setShowDashboard(true)}
                        className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-green-50 hover:text-green-700 text-gray-700 transition-colors duration-200"
                        title="Results Dashboard"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </button>
                    <button
                        onClick={() => setShowEval(true)}
                        className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-green-50 hover:text-green-700 text-gray-700 transition-colors duration-200"
                        title="Run Evaluation"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    </button>
                     <button
                        onClick={() => setShowHistory(true)}
                        className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-green-50 hover:text-green-700 text-gray-700 transition-colors duration-200"
                        title="History"
                    >
                        <ClockIcon className="h-6 w-6" />
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-green-50 hover:text-green-700 text-gray-700 transition-colors duration-200"
                        title="Settings"
                    >
                        <Cog6ToothIcon className="h-6 w-6" />
                    </button>
                </div>
            </header>
            
            {isOffline && <OfflineIndicator />}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-6 text-center shadow-sm" role="alert">
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
                    isLoading={isTranslating} 
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
                        className="p-3 rounded-full bg-green-600 hover:bg-green-700 shadow-lg text-white transition-all duration-200 ease-in-out transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        aria-label="Swap languages"
                    >
                        <ArrowsRightLeftIcon className="h-6 w-6" />
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

            {/* Modals & Panels */}
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
            <OfflineCapabilityMatrix
                isOpen={showMatrix}
                onClose={() => setShowMatrix(false)}
                isOffline={isOffline}
            />
            <EvaluationRunner
                isOpen={showEval}
                onClose={() => setShowEval(false)}
                onRunTest={async (text, targetLangName) => {
                    // Wrapper to bridge the runner with the app logic
                    return await handleTranslate(text, targetLangName);
                }}
            />
            <ResultsDashboard
                isOpen={showDashboard}
                onClose={() => setShowDashboard(false)}
            />
            <AccessibilityPanel
                isOpen={showAccessibility}
                onClose={() => setShowAccessibility(false)}
                highContrast={highContrast}
                setHighContrast={setHighContrast}
                fontSize={fontSize}
                setFontSize={setFontSize}
            />
        </div>
    );
};

export default App;
