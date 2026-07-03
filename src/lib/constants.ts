import type { CriticalErrorType, CheckAnswer } from '@/types/supabase'

export interface Criterion {
  number: number
  labelTr: string
  labelEn: string
  questionsTr: string[]
  questionsEn: string[]
}

export interface ChannelQuestion {
  number: number
  labelTr: string
  labelEn: string
}

export interface ScoreOption {
  value: number
  labelTr: string
  labelEn: string
}

export interface CheckAnswerOption {
  value: CheckAnswer
  labelTr: string
  labelEn: string
}

export interface CriticalErrorLabel {
  labelTr: string
  labelEn: string
}

export const CRITERIA: Criterion[] = [
  {
    number: 1,
    labelTr: 'Karşılama ve İlk İzlenim',
    labelEn: 'Reception and First Impression',
    questionsTr: [
      'Müşteri sıcak ve profesyonel bir şekilde karşılandı mı?',
      'İlk temastan itibaren güven verici bir izlenim bırakıldı mı?',
      'Müşteriye ismiyle veya nazik bir hitapla yaklaşıldı mı?',
    ],
    questionsEn: [
      'Was the customer greeted warmly and professionally?',
      'Was a trustworthy impression created from the first contact?',
      'Was the customer addressed by name or with a respectful greeting?',
    ],
  },
  {
    number: 2,
    labelTr: 'Kendini ve Kurumu Doğru Tanıtma',
    labelEn: 'Self and Company Introduction',
    questionsTr: [
      'Danışman adını ve görevini açıkça tanıttı mı?',
      'Natural Clinic hakkında doğru ve eksiksiz bilgi verildi mi?',
      "Kliniğin uzmanlık alanları uygun şekilde aktarıldı mı?",
    ],
    questionsEn: [
      'Did the consultant clearly introduce their name and role?',
      'Was correct and complete information provided about Natural Clinic?',
      "Were the clinic's areas of expertise conveyed appropriately?",
    ],
  },
  {
    number: 3,
    labelTr: 'İhtiyaç Analizi',
    labelEn: 'Needs Analysis',
    questionsTr: [
      "Müşterinin ihtiyaçlarını anlamak için doğru sorular soruldu mu?",
      'Müşteri aktif olarak ve kesintisiz dinlendi mi?',
      'Müşterinin gerçek ihtiyacı ve beklentisi doğru tespit edildi mi?',
    ],
    questionsEn: [
      "Were the right questions asked to understand the customer's needs?",
      'Was the customer listened to actively and without interruption?',
      "Was the customer's real need and expectation correctly identified?",
    ],
  },
  {
    number: 4,
    labelTr: 'Doğru ve Eksiksiz Bilgilendirme',
    labelEn: 'Correct and Complete Information',
    questionsTr: [
      'Tedavi, paket ve fiyat bilgileri doğru aktarıldı mı?',
      'Süreç ve beklentiler net bir şekilde açıklandı mı?',
      "Müşterinin tüm soruları eksiksiz yanıtlandı mı?",
    ],
    questionsEn: [
      'Was treatment, package, and pricing information correctly communicated?',
      'Were the process and expectations clearly explained?',
      "Were all of the customer's questions answered completely?",
    ],
  },
  {
    number: 5,
    labelTr: 'Güven Oluşturma',
    labelEn: 'Building Trust',
    questionsTr: [
      "Kliniğin referansları, sertifikaları veya başarı hikayeleri aktarıldı mı?",
      'Şeffaf ve dürüst bir iletişim kuruldu mu?',
      "Müşterinin kaygıları giderildi mi?",
    ],
    questionsEn: [
      "Were the clinic's references, certifications, or success stories shared?",
      'Was transparent and honest communication established?',
      "Were the customer's concerns addressed?",
    ],
  },
  {
    number: 6,
    labelTr: 'Empati, Ton ve İletişim Kalitesi',
    labelEn: 'Empathy, Tone and Communication Quality',
    questionsTr: [
      'Müşteriyle empati kuruldu mu ve anlaşıldığı hissettirildi mi?',
      'Ses tonu/yazım dili uygun, nazik ve profesyonel miydi?',
      'İletişim akıcı, anlaşılır ve saygılı bir şekilde kuruldu mu?',
    ],
    questionsEn: [
      'Was empathy established and did the customer feel understood?',
      'Was the tone/writing style appropriate, polite, and professional?',
      'Was communication fluent, clear, and respectful?',
    ],
  },
  {
    number: 7,
    labelTr: 'Satış Odaklı Yönlendirme',
    labelEn: 'Sales-Focused Guidance',
    questionsTr: [
      'Müşteri ihtiyacına uygun hizmet veya pakete yönlendirildi mi?',
      'Satış fırsatı aktif olarak değerlendirildi mi?',
      'Kampanya, paket veya özel teklifler uygun biçimde sunuldu mu?',
    ],
    questionsEn: [
      'Was the customer guided to the appropriate service or package?',
      'Was the sales opportunity actively pursued?',
      'Were campaigns, packages, or special offers presented appropriately?',
    ],
  },
  {
    number: 8,
    labelTr: 'İtiraz Karşılama',
    labelEn: 'Objection Handling',
    questionsTr: [
      "Müşterinin çekinceleri ve itirazları profesyonelce yanıtlandı mı?",
      'Fiyat veya zaman itirazları doğru tekniklerle yönetildi mi?',
      "Müşterinin kararını zorlaştıran engeller etkin biçimde aşıldı mı?",
    ],
    questionsEn: [
      "Were the customer's hesitations and objections handled professionally?",
      'Were price or timing objections managed with appropriate techniques?',
      "Were barriers to the customer's decision effectively overcome?",
    ],
  },
  {
    number: 9,
    labelTr: 'Kapanış ve Sonraki Aksiyon',
    labelEn: 'Closing and Next Action',
    questionsTr: [
      'Görüşme net bir sonuç veya aksiyon adımıyla kapatıldı mı?',
      'Müşteriye sonraki adımlar (randevu, ödeme, arama) açık şekilde iletildi mi?',
      'Görüşme profesyonel bir kapanış ifadesiyle tamamlandı mı?',
    ],
    questionsEn: [
      'Was the conversation closed with a clear outcome or next action?',
      'Were the next steps (appointment, payment, call) clearly communicated?',
      'Was the conversation completed with a professional closing statement?',
    ],
  },
  {
    number: 10,
    labelTr: 'CRM, Not ve Takip Disiplini',
    labelEn: 'CRM, Notes and Follow-up Discipline',
    questionsTr: [
      'Görüşme CRM sistemine eksiksiz ve doğru kaydedildi mi?',
      'Takip görevi, tarihi ve sorumlusu belirlendi mi?',
      'Müşteriyle ilgili önemli notlar ve detaylar kaydedildi mi?',
    ],
    questionsEn: [
      'Was the conversation recorded completely and correctly in CRM?',
      'Was a follow-up task, date, and responsible person assigned?',
      'Were important notes and details about the customer recorded?',
    ],
  },
]

export const WHATSAPP_QUESTIONS: ChannelQuestion[] = [
  { number: 1, labelTr: 'İlk dönüş süresi uygun mu?', labelEn: 'Is the first response time appropriate?' },
  { number: 2, labelTr: 'Mesaj dili profesyonel ve anlaşılır mı?', labelEn: 'Is the message language professional and clear?' },
  { number: 3, labelTr: 'Yazım hatası veya kopyala-yapıştır hissi var mı?', labelEn: 'Are there spelling errors or a copy-paste feel?' },
  { number: 4, labelTr: "Müşterinin sorularına eksiksiz cevap verilmiş mi?", labelEn: "Have the customer's questions been answered completely?" },
  { number: 5, labelTr: 'Fiyat ve paket bilgisi doğru aktarılmış mı?', labelEn: 'Has the price and package information been communicated correctly?' },
  { number: 6, labelTr: 'Gerekli görsel, video veya bilgilendirme içeriği paylaşılmış mı?', labelEn: 'Have the necessary images, videos, or informational content been shared?' },
  { number: 7, labelTr: 'Takip mesajı atılmış mı?', labelEn: 'Has a follow-up message been sent?' },
  { number: 8, labelTr: 'Mesajlar gereksiz uzun veya karmaşık mı?', labelEn: 'Are the messages unnecessarily long or complex?' },
  { number: 9, labelTr: 'Müşteri arama, ödeme veya randevu aşamasına yönlendirilmiş mi?', labelEn: 'Has the customer been directed to the calling, payment, or appointment stage?' },
  { number: 10, labelTr: 'Görüşme net aksiyonla kapatılmış mı?', labelEn: 'Was the conversation closed with a clear action?' },
]

export const CALL_QUESTIONS: ChannelQuestion[] = [
  { number: 1, labelTr: 'Danışmanın ses tonu enerjik ve güven verici mi?', labelEn: "Is the consultant's voice tone energetic and trustworthy?" },
  { number: 2, labelTr: "Müşterinin sözü kesilmeden dinlenmiş mi?", labelEn: 'Has the customer been listened to without interruption?' },
  { number: 3, labelTr: 'Danışman görüşmeye hakim mi?', labelEn: 'Is the consultant in control of the conversation?' },
  { number: 4, labelTr: 'Görüşme satış hedefine doğru yönetilmiş mi?', labelEn: 'Has the conversation been directed towards the sales goal?' },
  { number: 5, labelTr: 'Doğru ihtiyaç analizi soruları sorulmuş mu?', labelEn: 'Have the right needs analysis questions been asked?' },
  { number: 6, labelTr: 'İtirazlar profesyonel şekilde karşılanmış mı?', labelEn: 'Have objections been handled professionally?' },
  { number: 7, labelTr: 'Sessizlik, kararsızlık veya konu dağılması doğru yönetilmiş mi?', labelEn: 'Has silence, indecision, or topic drift been managed correctly?' },
  { number: 8, labelTr: 'Müşteri uygun zamanda aksiyona yönlendirilmiş mi?', labelEn: 'Has the customer been directed to action at the right time?' },
  { number: 9, labelTr: 'Görüşme sonunda özet ve sonraki adım verilmiş mi?', labelEn: 'Was a summary and next step provided at the end of the conversation?' },
  { number: 10, labelTr: 'Kapanış profesyonel şekilde yapılmış mı?', labelEn: 'Was the closing done professionally?' },
]

export const CRITICAL_ERROR_LABELS: Record<CriticalErrorType, CriticalErrorLabel> = {
  wrong_price: {
    labelTr: 'Yanlış fiyat bilgisi verilmesi',
    labelEn: 'Providing incorrect price information',
  },
  wrong_package: {
    labelTr: 'Yanlış paket veya operasyon bilgisi verilmesi',
    labelEn: 'Providing incorrect package or operation information',
  },
  result_guarantee: {
    labelTr: 'Kesin sonuç garantisi verilmesi',
    labelEn: 'Guaranteeing certain results',
  },
  medical_misleading: {
    labelTr: 'Tıbbi olarak yanıltıcı ifade kullanılması',
    labelEn: 'Using medically misleading statements',
  },
  rude_behavior: {
    labelTr: 'Müşteriye kaba veya ilgisiz davranılması',
    labelEn: 'Rude or indifferent behavior toward the customer',
  },
  unanswered_question: {
    labelTr: "Müşterinin sorusunun cevapsız bırakılması",
    labelEn: "Leaving the customer's question unanswered",
  },
  wrong_payment_guide: {
    labelTr: 'Ödeme sürecinin yanlış yönlendirilmesi',
    labelEn: 'Incorrect guidance on payment process',
  },
  wrong_appointment: {
    labelTr: 'Randevu veya operasyon tarihinin yanlış aktarılması',
    labelEn: 'Incorrect communication of appointment or operation date',
  },
  no_crm_record: {
    labelTr: 'CRM kaydının hiç işlenmemesi',
    labelEn: 'CRM record not being processed at all',
  },
  missed_followup: {
    labelTr: 'Eksik takip nedeniyle müşteri kaybı riski oluşması',
    labelEn: 'Risk of customer loss due to missed follow-up',
  },
}

export const SCORE_OPTIONS: ScoreOption[] = [
  { value: 10, labelTr: 'Başarılı', labelEn: 'Successful' },
  { value: 7, labelTr: 'Küçük Eksikler', labelEn: 'Minor Issues' },
  { value: 5, labelTr: 'Kısmen', labelEn: 'Partially' },
  { value: 0, labelTr: 'Başarısız', labelEn: 'Failed' },
]

export const CHECK_ANSWER_OPTIONS: CheckAnswerOption[] = [
  { value: 'successful', labelTr: 'Başarılı', labelEn: 'Successful' },
  { value: 'partially', labelTr: 'Kısmen Başarılı', labelEn: 'Partially Successful' },
  { value: 'unsuccessful', labelTr: 'Başarısız', labelEn: 'Unsuccessful' },
  { value: 'not_applicable', labelTr: 'Uygun Değil', labelEn: 'Not Applicable' },
]
