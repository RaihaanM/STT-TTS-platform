
export interface Language {
    code: string;
    name: string;
}

export interface TranslationHistoryItem {
    id: string;
    sourceLang: Language;
    targetLang: Language;
    sourceText: string;
    translatedText: string;
    timestamp: number;
}
