import type { Language, ScoreLevel } from '@/types'

type LocalizedText = {
  labelTr?: string
  labelEn?: string
  labelIt?: string
  label?: string
}

type LocalizedQuestions = {
  questionsTr?: string[]
  questionsEn?: string[]
  questionsIt?: string[]
}

export const IT_BY_EN: Record<string, string> = {
  Excellent: 'Eccellente',
  Good: 'Buono',
  'Needs Improvement': 'Da Migliorare',
  Risky: 'Rischioso',
  Unsuccessful: 'Non Riuscito',
  Perfect: 'Perfetto',
  Fair: 'Medio',
  Wrong: 'Errato',
  Successful: 'Riuscito',
  'Minor Issues': 'Problemi Minori',
  Partially: 'Parziale',
  Failed: 'Non Riuscito',
  'Partially Successful': 'Parzialmente Riuscito',
  'Not Applicable': 'Non Applicabile',
  Won: 'Vinta',
  Open: 'Aperta',
  'Follow Up': 'Follow-up',
  Lost: 'Persa',
  'No Answer': 'Nessuna Risposta',
  Call: 'Chiamata',
  Records: 'Record',
  'Default: last 30 days': 'Predefinito: ultimi 30 giorni',
  Submitted: 'Inviate',
  'Completed evaluations': 'Valutazioni completate',
  Drafts: 'Bozze',
  'Not submitted yet': 'Non ancora inviate',
  'Failed Records': 'Record Non Riusciti',
  'fail rate': 'tasso di fallimento',
  'Best consultant': 'Miglior consulente',
  avg: 'media',
  records: 'record',
  'No data': 'Nessun dato',
  'Top evaluator': 'Valutatore più attivo',
  evaluations: 'valutazioni',
  'Strongest channel': 'Canale più forte',
  'avg score': 'punteggio medio',
  'Improvement area': 'Area di miglioramento',
  'Result Breakdown': 'Distribuzione Risultati',
  'Conversation outcome mix': 'Distribuzione esiti conversazione',
  'Weekly Trend': 'Trend Settimanale',
  'Average score over last 6 weeks': 'Punteggio medio delle ultime 6 settimane',
  'Average score': 'Punteggio medio',
  'Not enough data for trend': 'Dati insufficienti per il trend',
  'Score Distribution': 'Distribuzione Punteggi',
  'Records by score range': 'Record per intervallo punteggio',
  'WhatsApp and call performance': 'Performance WhatsApp e chiamata',
  'Stage Analysis': 'Analisi Stage',
  'Strongest:': 'Più forte:',
  'Stage data': 'Dati stage',
  'Top Consultants': 'Migliori Consulenti',
  'Ranked by average score': 'Ordinati per punteggio medio',
  'Evaluator Performance': 'Performance Valutatori',
  'Quality team activity': 'Attività del team qualità',
  'Last 10 evaluations': 'Ultime 10 valutazioni',
  Stage: 'Stage',
  Result: 'Risultato',
  Performance: 'Performance',
  'Training Exams': 'Esami di Formazione',
  'Exam outcomes and recent records': 'Esiti esami e record recenti',
  'Exam Results': 'Risultati Esame',
  'Total Exams': 'Esami Totali',
  'Level Mix': 'Distribuzione Livelli',
  'No exam results yet': 'Ancora nessun risultato esame',
  Consultant: 'Consulente',
  Evaluator: 'Valutatore',
  Level: 'Livello',
  Date: 'Data',
  Score: 'Punteggio',
  'Final Score': 'Punteggio Finale',
  'Raw Score': 'Punteggio Grezzo',
  'Basic Info': 'Informazioni di Base',
  'Control Date': 'Data Controllo',
  'Stage Questions': 'Domande Stage',
  'Offer Questions': 'Domande Offerta',
  'Deal Questions': 'Domande Accordo',
  'Second Visit Question': 'Domanda Seconda Visita',
  'Criteria Scores': 'Punteggi Criteri',
  'Critical Errors': 'Errori Critici',
  'Sales Analysis': 'Analisi Vendite',
  'Development Plan': 'Piano di Sviluppo',
  'Evaluation Detail': 'Dettaglio Valutazione',
  Edit: 'Modifica',
  Loading: 'Caricamento',
  'Answers not recorded for this evaluation.': 'Risposte non registrate per questa valutazione.',
  'critical error(s)': 'errori critici',
  'Fresh Lead': 'Nuovo Lead',
  'New Sales Opportunities': 'Nuove Opportunità di Vendita',
  'Warm Lead': 'Lead Caldo',
  'Offer Created': 'Offerta Creata',
  'Offer Shared': 'Offerta Condivisa',
  'Willing to Close': 'Pronto alla Chiusura',
  Deal: 'Accordo',
  'Platform Agents': 'Agenti di Piattaforma',
  'Second Visit': 'Seconda Visita',
  'Response Time': 'Tempo di Risposta',
  'Professional Introduction': 'Presentazione Professionale',
  'Needs Assessment': 'Analisi dei Bisogni',
  'Build Trust': 'Creare Fiducia',
  'Info & Photo Collection': 'Raccolta Info e Foto',
  'Professional Communication': 'Comunicazione Professionale',
  'CRM Documentation': 'Documentazione CRM',
  'Confirm Next Steps': 'Conferma Prossimi Passi',
  'No Price Discussion First Call': 'Nessuna Discussione Prezzo nella Prima Chiamata',
  'Follow-Up Within One Week': 'Follow-up Entro Una Settimana',
  'Treatment Plan Sent?': 'Piano di Trattamento Inviato?',
  'Delivery Timing < 24h': 'Tempistica Consegna < 24h',
  'Professional PDF': 'PDF Professionale',
  'Clear Explanation': 'Spiegazione Chiara',
  'Before/After Photos': 'Foto Prima/Dopo',
  'Concise Communication': 'Comunicazione Concisa',
  'Follow-Up After Offer': 'Follow-up Dopo Offerta',
  'CRM Updated?': 'CRM Aggiornato?',
  'Price Confirmed?': 'Prezzo Confermato?',
  'Travel Details Confirmed?': 'Dettagli di Viaggio Confermati?',
  'Professional Follow-Up After Deal': 'Follow-up Professionale Dopo Accordo',
  'Professional Follow-Up': 'Follow-up Professionale',
  'No follow-up': 'Nessun follow-up',
  '1 follow-up': '1 follow-up',
  '2 follow-ups': '2 follow-up',
  '3+ follow-ups': '3+ follow-up',
  'Motivation understood?': 'Motivazione compresa?',
  'Decision eased?': 'Decisione facilitata?',
  'Opportunity used?': 'Opportunità usata?',
  'Result reason': 'Motivo del risultato',
  'Best behavior': 'Miglior comportamento',
  'Risk behavior': 'Comportamento a rischio',
  Strengths: 'Punti di Forza',
  'Areas to Improve': 'Aree da Migliorare',
  'Coaching Topic': 'Argomento di Coaching',
  'Team Leader Comment': 'Commento del Team Leader',
  'Consultant Plan': 'Piano del Consulente',
}

export function translateEnglishToItalian(value: string) {
  return IT_BY_EN[value] ?? value
}

export function textFor(lang: Language, tr: string, en: string, it: string) {
  return lang === 'tr' ? tr : lang === 'it' ? it : en
}

export function appLocale(lang: Language) {
  return lang === 'tr' ? 'tr-TR' : lang === 'it' ? 'it-IT' : 'en-US'
}

export function labelFor(lang: Language, item: LocalizedText) {
  if (lang === 'tr') return item.labelTr ?? item.label ?? item.labelEn ?? ''
  if (lang === 'it') return item.labelIt ?? (item.labelEn ? IT_BY_EN[item.labelEn] : undefined) ?? item.labelEn ?? item.label ?? item.labelTr ?? ''
  return item.labelEn ?? item.label ?? item.labelTr ?? ''
}

export function questionsFor(lang: Language, item: LocalizedQuestions) {
  if (lang === 'tr') return item.questionsTr ?? item.questionsEn ?? []
  if (lang === 'it') return item.questionsIt ?? item.questionsEn ?? item.questionsTr ?? []
  return item.questionsEn ?? item.questionsTr ?? []
}

export function scoreLevelLabel(lang: Language, level: ScoreLevel) {
  return lang === 'tr'
    ? level.label
    : lang === 'it'
      ? level.labelIt ?? IT_BY_EN[level.labelEn] ?? level.labelEn
      : level.labelEn
}
