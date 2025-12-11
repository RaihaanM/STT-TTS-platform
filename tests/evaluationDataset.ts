
export interface EvaluationItem {
  id: string;
  domain: 'healthcare' | 'travel' | 'education' | 'general';
  sourceText: string;
  targetLangName: string; // Providing target helps guide the test runner
}

// focused on Indian languages + English scenarios
export const EVALUATION_DATASET: EvaluationItem[] = [
  // Healthcare
  { id: 'hc-1', domain: 'healthcare', sourceText: 'Where is the nearest pharmacy?', targetLangName: 'Hindi' },
  { id: 'hc-2', domain: 'healthcare', sourceText: 'I have a severe headache and fever.', targetLangName: 'Tamil' },
  { id: 'hc-3', domain: 'healthcare', sourceText: 'Do I need a prescription for this medicine?', targetLangName: 'Bengali' },
  { id: 'hc-4', domain: 'healthcare', sourceText: 'Please call an ambulance immediately.', targetLangName: 'Telugu' },
  
  // Travel
  { id: 'tr-1', domain: 'travel', sourceText: 'How much does a ticket to Mumbai cost?', targetLangName: 'Marathi' },
  { id: 'tr-2', domain: 'travel', sourceText: 'Can you recommend a good vegetarian restaurant?', targetLangName: 'Gujarati' },
  { id: 'tr-3', domain: 'travel', sourceText: 'I have lost my luggage at the airport.', targetLangName: 'Kannada' },
  { id: 'tr-4', domain: 'travel', sourceText: 'Is this train going to Delhi?', targetLangName: 'Punjabi' },

  // Education
  { id: 'ed-1', domain: 'education', sourceText: 'Mathematics is my favorite subject.', targetLangName: 'Malayalam' },
  { id: 'ed-2', domain: 'education', sourceText: 'What represents the flag of India?', targetLangName: 'Hindi' },
  { id: 'ed-3', domain: 'education', sourceText: 'The library is open from 9 AM to 5 PM.', targetLangName: 'Oriya' },
  
  // General / Conversational
  { id: 'gn-1', domain: 'general', sourceText: 'Hello, how are you doing today?', targetLangName: 'Hindi' },
  { id: 'gn-2', domain: 'general', sourceText: 'The weather is beautiful this morning.', targetLangName: 'Assamese' },
  { id: 'gn-3', domain: 'general', sourceText: 'I would like to learn more about your culture.', targetLangName: 'Urdu' },
  { id: 'gn-4', domain: 'general', sourceText: 'Thank you very much for your help.', targetLangName: 'Sanskrit' },
];
