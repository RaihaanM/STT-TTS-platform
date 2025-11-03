import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language } from './types';
import { INDIAN_LANGUAGES } from './constants';
import { translateText, textToSpeech } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audioUtils';
import LanguagePanel from './components/LanguagePanel';
import { ArrowPathIcon, ArrowsRightLeftIcon } from './components/icons';

// Polyfill for webkitSpeechRecognition
// FIX: Cast window to `any` to access non-standard SpeechRecognition APIs and prevent TypeScript errors.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const App: React.FC = () => {
    const [sourceLang, setSourceLang] = useState<Language>(INDIAN_LANGUAGES[5]); // Hindi
    const [targetLang, setTargetLang] = useState<Language>(INDIAN_LANGUAGES[10]); // English (added to constants)
    const [sourceText, setSourceText] = useState<string>('');
    const [translatedText, setTranslatedText] = useState<string>('');
    const [isTranslating, setIsTranslating] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isPlayingSource, setIsPlayingSource] = useState<boolean>(false);
    const [isPlayingTarget, setIsPlayingTarget] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // FIX: Use `any` for the SpeechRecognition instance type to resolve the type error.
    const recognitionRef = useRef<any | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const debounceTimeoutRef = useRef<number | null>(null);

    // Initialize AudioContext on user interaction
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
        if (!text.trim()) {
            setTranslatedText('');
            return;
        }
        setIsTranslating(true);
        setError(null);
        try {
            const result = await translateText(text, sourceLang.name, targetLang.name);
            setTranslatedText(result);
        } catch (err) {
            console.error(err);
            setError("Failed to translate. Please try again.");
            setTranslatedText('');
        } finally {
            setIsTranslating(false);
        }
    }, [sourceLang, targetLang]);


    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        if (sourceText.trim()) {
            debounceTimeoutRef.current = window.setTimeout(() => {
                handleTranslate(sourceText);
            }, 500);
        } else {
            setTranslatedText('');
        }

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [sourceText, handleTranslate]);
    

    const handleSwapLanguages = () => {
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
            setIsRecording(false);
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
    
    const playAudio = async (text: string, lang: Language, setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>) => {
        if (!text.trim() || isPlayingSource || isPlayingTarget) return;

        initAudioContext();
        if (!audioContextRef.current) return;
        
        setIsPlaying(true);
        setError(null);
        try {
            // FIX: The language name is no longer needed as the model infers it from the text.
            const audioData = await textToSpeech(text);
            const decodedData = decode(audioData);
            const audioBuffer = await decodeAudioData(decodedData, audioContextRef.current, 24000, 1);
            
            const sourceNode = audioContextRef.current.createBufferSource();
            sourceNode.buffer = audioBuffer;
            sourceNode.connect(audioContextRef.current.destination);
            sourceNode.start();
            sourceNode.onended = () => setIsPlaying(false);

        } catch (err) {
            console.error(err);
            setError(`Failed to generate audio for ${lang.name}.`);
            setIsPlaying(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8 flex flex-col">
            <header className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Polyglot India
                </h1>
                <p className="text-gray-400 mt-2 text-lg">AI-Powered Speech and Text Translation</p>
            </header>
            
            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6 text-center" role="alert">
                    <span className="block sm:inline">{error}</span>
                    <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
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
                    isLoading={false}
                    showRecordButton={true}
                    placeholder="Enter text or use microphone..."
                />

                <div className="flex items-center justify-center w-full lg:w-auto my-2 lg:my-0">
                    <button
                        onClick={handleSwapLanguages}
                        className="p-3 rounded-full bg-gray-700 hover:bg-purple-600 transition-all duration-200 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
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
                    placeholder="Translation will appear here..."
                />
            </main>
        </div>
    );
};

export default App;