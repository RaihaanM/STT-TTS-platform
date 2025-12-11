
import React, { useState } from 'react';
import { EVALUATION_DATASET, EvaluationItem } from '../tests/evaluationDataset';
import { metricsService } from '../services/metricsService';
import { XMarkIcon } from './icons';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onRunTest: (text: string, targetLangName: string) => Promise<string>;
}

interface TestResult {
    itemId: string;
    latency: number;
    rating: number;
    translation: string;
}

const EvaluationRunner: React.FC<Props> = ({ isOpen, onClose, onRunTest }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [results, setResults] = useState<TestResult[]>([]);
    const [currentTranslation, setCurrentTranslation] = useState('');
    const [currentLatency, setCurrentLatency] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    if (!isOpen) return null;

    const currentItem = EVALUATION_DATASET[currentIndex];
    const isComplete = currentIndex >= EVALUATION_DATASET.length;

    const handleRunItem = async () => {
        setIsRunning(true);
        try {
            const start = performance.now();
            const result = await onRunTest(currentItem.sourceText, currentItem.targetLangName);
            const end = performance.now();
            
            setCurrentTranslation(result);
            setCurrentLatency(Math.round(end - start));
        } catch (e) {
            console.error(e);
            setCurrentTranslation("Error: Failed to translate");
        } finally {
            setIsRunning(false);
        }
    };

    const handleRate = (rating: number) => {
        const result: TestResult = {
            itemId: currentItem.id,
            latency: currentLatency,
            rating,
            translation: currentTranslation
        };

        const existing = JSON.parse(localStorage.getItem('langlink-eval-results') || '[]');
        localStorage.setItem('langlink-eval-results', JSON.stringify([...existing, result]));

        setResults([...results, result]);
        setCurrentTranslation('');
        setCurrentLatency(0);
        setCurrentIndex(prev => prev + 1);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full border border-slate-200 shadow-2xl p-8 relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800">
                    <XMarkIcon className="h-6 w-6" />
                </button>

                <h2 className="text-2xl font-bold mb-6 text-slate-800">Evaluation Runner</h2>

                {isComplete ? (
                    <div className="text-center py-10">
                        <h3 className="text-xl text-green-600 font-bold mb-4">Evaluation Complete!</h3>
                        <p className="text-slate-500">Thank you for contributing to the dataset.</p>
                        <button onClick={onClose} className="mt-6 px-6 py-2 bg-green-600 rounded-full text-white hover:bg-green-700 shadow-md">
                            Close
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <div className="flex justify-between mb-4 text-sm text-slate-400 uppercase font-bold tracking-wide">
                                <span>Item {currentIndex + 1} / {EVALUATION_DATASET.length}</span>
                                <span>Domain: {currentItem.domain}</span>
                            </div>
                            <div className="mb-6">
                                <span className="block text-xs text-slate-500 font-semibold uppercase mb-1">Source (English)</span>
                                <p className="text-2xl text-slate-800 font-medium">{currentItem.sourceText}</p>
                            </div>
                            <div>
                                <span className="block text-xs text-slate-500 font-semibold uppercase mb-1">Target Language</span>
                                <p className="text-lg text-green-600 font-bold">{currentItem.targetLangName}</p>
                            </div>
                        </div>

                        {currentTranslation ? (
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg animate-fade-in">
                                <span className="block text-xs text-slate-400 font-semibold uppercase mb-1">System Output</span>
                                <p className="text-xl text-slate-800 mb-2">{currentTranslation}</p>
                                <p className="text-xs text-slate-400 mb-6">Latency: {currentLatency}ms</p>
                                
                                <div className="border-t border-slate-100 pt-4">
                                    <p className="text-center mb-3 text-sm font-semibold text-slate-600">Rate Quality (1-5)</p>
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button 
                                                key={star}
                                                onClick={() => handleRate(star)}
                                                className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-yellow-400 hover:text-white hover:shadow-md transition-all flex items-center justify-center font-bold"
                                            >
                                                {star}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center py-8">
                                <button
                                    onClick={handleRunItem}
                                    disabled={isRunning}
                                    className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-full transition-all transform hover:scale-105 shadow-lg"
                                >
                                    {isRunning ? 'Translating...' : 'Run Translation'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EvaluationRunner;
