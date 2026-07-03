# Natural Clinic QC — Claude Code Görev Sırası

Bu dosyadaki görevleri **sırayla** Claude Code'a ver.
Bir görev bitmeden diğerine geçme.

---

## GÖREV 0 — Proje Kurulumu

```
Next.js 14 projesi kur. App Router kullan, TypeScript strict mode, Tailwind CSS dahil et.

Sonra şu paketleri yükle:
- @supabase/supabase-js
- @supabase/ssr
- framer-motion
- react-hook-form
- zod
- @hookform/resolvers
- zustand
- recharts
- xlsx
- @react-pdf/renderer
- lucide-react
- date-fns

Proje kökünde .env.local dosyası oluştur:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key


SPEC.md dosyasındaki klasör yapısını oluştur (boş dosyalar olarak).
```

---

## GÖREV 1 — Supabase Client ve Tipler

```
SPEC.md dosyasını oku.

src/lib/supabase/client.ts → browser Supabase client oluştur (@supabase/ssr kullan)
src/lib/supabase/server.ts → server Supabase client oluştur (cookies ile)
src/middleware.ts → auth middleware, korumalı route'lar için session kontrolü

src/types/supabase.ts dosyasını oluştur. İçinde şu Supabase tablolarının TypeScript tiplerini tanımla:
- profiles (id, full_name, email, role, team_id, team_leader_id, is_active, created_at)
- teams (id, name, created_at)
- evaluations (tüm kolonlar — SPEC.md'deki tablo yapısına göre)
- criteria_scores (id, evaluation_id, criteria_number, score, score_value, comment)
- channel_checks (id, evaluation_id, channel, question_number, answer)
- critical_errors (id, evaluation_id, error_type, description, created_at)

Enum tipleri:
- UserRole: 'quality_team' | 'team_leader' | 'manager' | 'consultant'
- ChannelType: 'whatsapp' | 'call'
- ConversationResult: 'won' | 'open' | 'follow_up' | 'lost' | 'no_answer'
- CriteriaScore: '10' | '7' | '5' | '0'
- CheckAnswer: 'successful' | 'partially' | 'unsuccessful' | 'not_applicable'
- EvaluationStatus: 'draft' | 'submitted' | 'approved' | 'rejected'
- CriticalErrorType: 'wrong_price' | 'wrong_package' | 'result_guarantee' | 'medical_misleading' | 'rude_behavior' | 'unanswered_question' | 'wrong_payment_guide' | 'wrong_appointment' | 'no_crm_record' | 'missed_followup'
```

---

## GÖREV 2 — Sabitler ve Yardımcı Fonksiyonlar

```
SPEC.md dosyasını oku.

src/lib/constants.ts dosyasını oluştur. İçinde:

1. CRITERIA listesi (10 eleman):
   Her eleman: { number, labelTr, labelEn, questionsTr: string[], questionsEn: string[] }
   SPEC.md Adım 2'deki 10 kriteri ve alt sorularını ekle.

2. WHATSAPP_QUESTIONS listesi (10 soru, TR ve EN)
   SPEC.md Adım 3 WhatsApp bölümünden al.

3. CALL_QUESTIONS listesi (10 soru, TR ve EN)
   SPEC.md Adım 3 Arama bölümünden al.

4. CRITICAL_ERROR_LABELS objesi:
   Her CriticalErrorType için TR ve EN label.

5. SCORE_OPTIONS: [0, 5, 7, 10] — kriter puan seçenekleri

6. CHECK_ANSWER_OPTIONS: TR ve EN label ile 4 seçenek

src/lib/scoring.ts dosyasını oluştur:
- calculateFinalScore(rawScore, criticalErrorCount, isAutoFailed) fonksiyonu
- getScoreLevel(score) fonksiyonu → label, labelEn, color, bgColor döner
- isCommentRequired(scoreValue) fonksiyonu
SPEC.md'deki puan hesaplama mantığını birebir uygula.

src/lib/i18n.ts dosyasını oluştur:
- Tüm UI metinlerini TR ve EN olarak içeren translations objesi
- useLanguage hook'u: localStorage'dan dil okur, değiştirir, component'lara verir
```

---

## GÖREV 3 — Auth Sayfası

```
SPEC.md dosyasını oku.

src/app/(auth)/login/page.tsx sayfasını oluştur.

Tasarım:
- Sol yarı: Natural Clinic logosu (NC harfleri veya metin), koyu yeşil (#1B4332) arka plan, beyaz yazı, kısa slogan
- Sağ yarı: beyaz arka plan, login formu ortada

Form alanları:
- E-posta (input)
- Şifre (input, göster/gizle toggle)
- Giriş Yap butonu (koyu yeşil, tam genişlik)
- Hata mesajı alanı

Supabase Auth ile email/password login yap.
Başarılı girişte kullanıcının rolüne göre yönlendir:
- consultant → /dashboard/my-evaluations
- diğerleri → /dashboard

Dil toggle'ı sağ üstte: TR | EN
Mobil uyumlu olsun.
```

---

## GÖREV 4 — Dashboard Layout ve Sidebar

```
SPEC.md dosyasını oku.

src/app/(dashboard)/layout.tsx oluştur.

Sol sidebar:
- Üstte Natural Clinic logosu / NC
- Menü linkleri (role göre farklı):
  - Dashboard (hepsi)
  - Yeni Değerlendirme (quality_team, team_leader)
  - Değerlendirmeler (quality_team, team_leader, manager)
  - Raporlar (quality_team, team_leader, manager)
  - Ayarlar (hepsi)
- Altta kullanıcı adı, rolü, çıkış butonu

Üst header:
- Sayfa başlığı
- Dil toggle (TR | EN)
- Bildirim ikonu (şimdilik boş)

Sidebar mobilde hamburger menüye dönüşsün.
Renk: koyu yeşil (#1B4332) sidebar, beyaz content area.
Supabase'den login olan kullanıcının profil bilgisini çek (profiles tablosu).
```

---

## GÖREV 5 — Dashboard Ana Sayfası

```
SPEC.md dosyasını oku.

src/app/(dashboard)/dashboard/page.tsx oluştur.

Rol bazlı içerik:

quality_team ve manager için:
- Üstte 4 istatistik kartı:
  * Bu ay toplam değerlendirme sayısı
  * Ortalama kalite skoru
  * Kritik hata sayısı
  * Won oranı (%)
- Danışman bazlı ortalama skor tablosu (son 30 gün)
- Kanal karşılaştırması: WhatsApp vs Arama ortalama skor (bar chart - Recharts)

team_leader için:
- Aynı kartlar ama sadece kendi takımı için

consultant için:
- Kendi son 10 değerlendirmesinin listesi
- Ortalama skoru
- Gelişim önerileri (son değerlendirmedeki dev_areas_to_improve alanı)

Veriler Supabase'den çekilecek. Loading skeleton göster.
```

---

## GÖREV 6 — Form Store (Zustand)

```
src/stores/formStore.ts oluştur.

Zustand store içinde tüm form state:

interface FormStore {
  // Adım kontrolü
  currentStep: number  // 1-6
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void

  // Adım 1 — Temel bilgiler
  basicInfo: {
    consultantId: string
    teamLeaderId: string
    teamId: string
    customerName: string
    leadId: string
    channel: 'whatsapp' | 'call' | null
    conversationDate: string
    evaluationDate: string
    conversationResult: string
    generalNote: string
  }
  setBasicInfo: (data: Partial<BasicInfo>) => void

  // Adım 2 — Kriter puanları
  criteriaScores: Array<{
    criteriaNumber: number
    scoreValue: number
    comment: string
  }>
  setCriteriaScore: (criteriaNumber: number, scoreValue: number, comment: string) => void
  rawScore: number  // otomatik hesaplanır

  // Adım 3 — Kanal kontrolleri
  channelChecks: Array<{
    questionNumber: number
    answer: string
  }>
  setChannelCheck: (questionNumber: number, answer: string) => void

  // Adım 4 — Kritik hatalar
  criticalErrors: Array<{
    errorType: string
    description: string
  }>
  toggleCriticalError: (errorType: string) => void
  setCriticalErrorDescription: (errorType: string, description: string) => void
  isAutoFailed: boolean
  setAutoFailed: (value: boolean) => void

  // Adım 5 — Satış analizi
  salesAnalysis: { [key: string]: string }
  setSalesAnalysis: (field: string, value: string) => void

  // Adım 6 — Gelişim planı
  actionPlan: { [key: string]: string }
  setActionPlan: (field: string, value: string) => void

  // Hesaplanan skorlar
  finalScore: number
  criticalErrorCount: number

  // Reset
  resetForm: () => void

  // Edit modu
  editingEvaluationId: string | null
  setEditingId: (id: string | null) => void
}

rawScore ve finalScore otomatik hesaplansın (scoring.ts fonksiyonlarını kullan).
```

---

## GÖREV 7 — Animasyonlu Form (Ana Bileşen)

```
SPEC.md dosyasını oku. Özellikle "Form Adımları" bölümünü dikkatlice incele.

src/app/(dashboard)/evaluations/new/page.tsx oluştur.
src/components/form/FormStepper.tsx oluştur.

Genel yapı:
- Tam ekran form (sidebar hariç)
- Üstte ilerleme çubuğu (6 adım, aktif adım vurgulu)
- Sağ üstte canlı skor göstergesi (daire progress bar, 0-100)
- Ortada aktif adım içeriği
- Altta Geri / İleri butonları

Framer Motion animasyonu:
- Adımlar arası geçiş: mevcut adım sola kayar (x: 0 → -100%, opacity: 1 → 0)
- Yeni adım sağdan gelir (x: 100% → 0, opacity: 0 → 1)
- duration: 0.35s, ease: easeInOut

Skor göstergesi:
- Daire SVG progress bar
- Merkezdeki sayı canlı güncellenir
- Renk score level'a göre değişir (yeşil/mavi/sarı/turuncu/kırmızı)

Adım geçişinde validasyon:
- Adım 1: zorunlu alanlar dolu mu?
- Adım 2: tüm 10 kritere puan verilmiş mi? puan <10 ise yorum yazılmış mı?
- Adım 3: tüm 10 soruya cevap verilmiş mi?
- Adım 4: kritik hata seçildiyse açıklama yazılmış mı?
- Adım 5 ve 6: opsiyonel, validasyon yok

Dil desteği: tüm metinler i18n.ts'den gelsin.
```

---

## GÖREV 8 — Form Adım Bileşenleri

```
SPEC.md'deki form adımlarını oku.

Şu bileşenleri oluştur:

1. src/components/form/StepBasicInfo.tsx
   - Her alan için temiz input/select/date bileşenleri
   - Kanal seçimi: WhatsApp ve Arama için iki büyük kart (ikon + yazı), seçili kart vurgulu
   - Danışman ve TL dropdown'ları Supabase'den gelsin
   - Tasarım: büyük başlık, altında input, aralarında yeterli boşluk

2. src/components/form/StepCriteria.tsx
   - Her kriter için ayrı section
   - Kriter başlığı + altında açıklayıcı 3 soru (küçük metin)
   - 4 puan kartı: yan yana, her birinde puan ve kısa açıklama
     * 10 → "Başarılı" (yeşil)
     * 7  → "Küçük Eksikler" (mavi)
     * 5  → "Kısmen" (sarı)
     * 0  → "Başarısız" (kırmızı)
   - Seçili kart border ile vurgulansın
   - Puan 10 değilse yorum textarea'sı animasyonla açılsın
   - Tüm 10 kriter tek sayfada scroll ile, ya da her kriter ayrı mini adım

3. src/components/form/StepChannelChecks.tsx
   - Kanal tipine göre otomatik 10 soru göster
   - Her soru için 4 toggle butonu (Başarılı / Kısmen / Başarısız / Uygun Değil)
   - Seçili buton dolgu renginde, seçilmemiş outline

4. src/components/form/StepCriticalErrors.tsx
   - 10 kritik hata checkbox kartı
   - Seçince kırmızıya dönsün, açıklama textarea'sı animasyonla açılsın
   - Alt kısımda sarı uyarı kutusu: "X kritik hata seçildi, max puan Y olacak"
   - 3+ seçilirse kırmızı uyarı: "Görüşme otomatik başarısız sayılacak"
   - "Direkt Başarısız İşaretle" toggle butonu

5. src/components/form/StepSalesAnalysis.tsx
   - 6 soru, her biri için textarea
   - Büyük, rahat okunur layout

6. src/components/form/StepActionPlan.tsx
   - 5 textarea + 1 date picker
   - Form sonunda büyük ScoreBadge bileşeni göster

7. src/components/form/ScoreBadge.tsx
   - Büyük renkli rozet (Mükemmel / İyi / Geliştirilmeli / Riskli / Başarısız)
   - Son skor sayısı büyük font
   - Kriter bazlı mini özet tablo
   - Animasyonlu giriş (scale: 0 → 1)
```

---

## GÖREV 9 — Form Kaydetme

```
Formun kaydetme mantığını implement et.

src/hooks/useEvaluation.ts hook'unu oluştur. İçinde:

saveEvaluation(status: EvaluationStatus) fonksiyonu:
1. formStore'dan tüm veriyi al
2. finalScore ve criticalErrorCount hesapla (scoring.ts)
3. Supabase'e şu sırayla kaydet:
   a. evaluations tablosuna INSERT → evaluation id al
   b. criteria_scores tablosuna 10 satır INSERT (evaluation_id ile)
   c. channel_checks tablosuna 10 satır INSERT
   d. critical_errors tablosuna seçili hatalar INSERT
4. Başarılıysa /evaluations/[id] sayfasına yönlendir
5. Hata varsa toast mesajı göster

updateEvaluation(id: string, status: EvaluationStatus) fonksiyonu:
1. Aynı mantık ama UPDATE kullan
2. Alt tablolar için: önce DELETE, sonra INSERT (en temiz yaklaşım)

getEvaluation(id: string) fonksiyonu:
1. evaluations tablosundan çek
2. JOIN ile criteria_scores, channel_checks, critical_errors al
3. formStore'a yükle (edit modu için)

Form butonlarını bağla:
- "Kaydet" → saveEvaluation('approved')
- "Taslak Kaydet" → saveEvaluation('draft')
- "Gönder" → saveEvaluation('submitted')
- Loading state göster, çift tıklamayı engelle
```

---

## GÖREV 10 — Değerlendirme Listesi Sayfası

```
src/app/(dashboard)/evaluations/page.tsx oluştur.

Tablo sütunları:
- Danışman adı
- Müşteri adı
- Kanal (WhatsApp / Arama ikonu)
- Görüşme tarihi
- Sonuç (Won/Lost/Open badge)
- Final skor (renkli)
- Başarı seviyesi (badge)
- Değerlendiren
- Durum (draft/submitted/approved)
- İşlemler (görüntüle, düzenle, PDF indir)

Özellikler:
- Üstte arama kutusu (danışman veya müşteri adına göre)
- Filtre paneli: kanal, sonuç, tarih aralığı, skor aralığı
- Sayfalama (20 kayıt/sayfa)
- RLS zaten var, Supabase otomatik filtreler ama role bazlı UI da göster
- Sıralama: tarihe göre (yeni önce)
- "Yeni Değerlendirme" butonu (quality_team ve team_leader için)
```

---

## GÖREV 11 — Raporlar Sayfası

```
SPEC.md raporlama bölümünü oku.

src/app/(dashboard)/reports/page.tsx oluştur.

Filtre paneli (sol veya üst):
- Tarih aralığı (başlangıç - bitiş)
- Danışman dropdown (çoklu seçim)
- Team Leader dropdown
- Takım dropdown
- Kanal (WhatsApp / Arama / Tümü)
- Görüşme sonucu
- Kritik hata var/yok

4 rapor sekme/bölümü:

1. Danışman Performansı:
   - Tablo: danışman adı, değerlendirme sayısı, ortalama skor, kritik hata sayısı, won oranı
   - Skor trendi çizgi grafik (Recharts LineChart)

2. Kanal Karşılaştırması:
   - WhatsApp vs Arama ortalama skor (BarChart)
   - Her kanal için kritik hata dağılımı (PieChart)

3. Kritik Hata Raporu:
   - Hata türü bazlı sayım tablosu
   - Hangi danışmanda kaç kez çıkmış

4. Satış Sonucu & Kalite:
   - Won/Lost/Open için ortalama skor karşılaştırması

Excel'e Aktar butonu: tüm filtrelenmiş verinin xlsx çıktısı
```

---

## GÖREV 12 — PDF Export

```
src/lib/pdf/EvaluationPDF.tsx oluştur (@react-pdf/renderer kullan).

PDF içeriği:
- Üst header: Natural Clinic logosu (metin), değerlendirme tarihi, değerlendiren kişi
- Temel bilgiler tablosu (danışman, müşteri, kanal, sonuç)
- Final skor büyük, başarı seviyesi renkli
- Kriter puanları tablosu (kriter adı, puan, yorum)
- Kanal kontrol soruları tablosu
- Kritik hatalar (varsa kırmızı kutu)
- Satış analizi metinleri
- Gelişim planı
- Footer: sayfa numarası, oluşturma tarihi

Değerlendirme detay sayfasında ve liste sayfasında "PDF İndir" butonu ile tetiklensin.
Türkçe font desteği için Source Sans Pro veya benzeri font embed et.
```

---

## GÖREV 13 — Son Kontroller

```
Şunları kontrol et ve düzelt:

1. middleware.ts: giriş yapmamış kullanıcılar /login'e yönlendirilsin
2. consultant rolü /evaluations/new sayfasına giremez → /dashboard'a yönlendir
3. Tüm sayfalarda loading ve error state var mı?
4. Form adımları arası geçişte scroll en üste gitsin
5. Mobil görünümde sidebar hamburger menü çalışıyor mu?
6. Dil değiştirince tüm metinler değişiyor mu?
7. .env.local dosyası .gitignore'da var mı?
8. Supabase tip importları doğru mu?

next.config.js'e ekle:
- images: supabase domain'i allow et

Son olarak: npm run build çalıştır, TypeScript hataları varsa düzelt.
```

---

## Not

Her görev bittikten sonra tarayıcıda test et, sonra bir sonraki göreve geç.
Hata çıkarsa Claude Code'a hata mesajını ver, düzeltmesini iste.
Supabase'de veri görmek için Table Editor → ilgili tablo → Insert ile test verisi ekleyebilirsin.
