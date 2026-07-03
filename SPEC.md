# Natural Clinic QC — Proje Spesifikasyonu

Bu dosya Claude Code için tam proje referansıdır. Kod yazarken bu dosyaya göre hareket et.

---

## Claude Code Çalışma Kuralları

Bu kurallar her görevde geçerlidir. İstisna yoktur.

1. **KOD DEĞİŞİKLİĞİ PRENSİBİ:** Bir dosyayı asla tamamen silip baştan yazma. Sadece değişmesi gereken satırları bul ve orayı düzenle.

2. **DÜŞÜNME SÜRECİ:** Kodu yazmadan önce "Şöyle bir yol izleyeceğim, şu dosyaları değiştireceğim" diye özet geç. Kullanıcı onay verince koda başla.

3. **OKUMA ZORUNLULUĞU:** Bir dosyada değişiklik yapmadan önce MUTLAKA dosyanın en güncel halini oku. Ezberden kod yazma.

4. **HATA YÖNETİMİ:** Try-catch bloklarını asla boş bırakma. Konsola detaylı hata logları bas.

5. **MODÜLERLİK:** Kodu tek bir devasa dosyaya yığma. Parçalara böl (DRY Prensibi).

---

## Proje Özeti

Natural Clinic hasta danışmanlığı ekibi için **WhatsApp ve telefon görüşmesi kalite kontrol sistemi**.
Quality ekibi ve Team Leader'lar form doldurur, yöneticiler raporları görür.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Dil:** TypeScript (strict mode)
- **Veritabanı:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Stil:** Tailwind CSS
- **Animasyon:** Framer Motion (form adım geçişleri için)
- **Form:** React Hook Form + Zod validation
- **Grafikler:** Recharts
- **PDF Export:** @react-pdf/renderer
- **Excel Export:** xlsx
- **State:** Zustand (global form state)
- **İkonlar:** Lucide React

---

## Supabase Bağlantısı

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Klasör Yapısı

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Sidebar + header
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── evaluations/
│   │   │   ├── page.tsx         # Değerlendirme listesi
│   │   │   ├── new/
│   │   │   │   └── page.tsx     # Yeni form
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Detay / düzenleme
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── layout.tsx
│   └── page.tsx                 # / → login'e redirect
├── components/
│   ├── form/
│   │   ├── FormStepper.tsx      # Adım göstergesi
│   │   ├── StepBasicInfo.tsx    # Adım 1: Temel bilgiler
│   │   ├── StepCriteria.tsx     # Adım 2: 10 kriter puanlama
│   │   ├── StepChannelChecks.tsx # Adım 3: WhatsApp/Arama soruları
│   │   ├── StepCriticalErrors.tsx # Adım 4: Kritik hatalar
│   │   ├── StepSalesAnalysis.tsx  # Adım 5: Satış analizi
│   │   ├── StepActionPlan.tsx     # Adım 6: Gelişim planı
│   │   └── ScoreBadge.tsx       # Otomatik başarı rozeti
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── ScoreChart.tsx
│   │   └── RecentEvaluations.tsx
│   ├── reports/
│   │   ├── FilterPanel.tsx
│   │   ├── ConsultantTable.tsx
│   │   └── ChannelComparison.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Textarea.tsx
│       ├── Badge.tsx
│       └── Modal.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts
│   ├── scoring.ts               # Puan hesaplama mantığı
│   ├── i18n.ts                  # TR/EN çeviriler
│   └── constants.ts             # Kriterler, sorular, hatalar
├── hooks/
│   ├── useEvaluation.ts
│   ├── useReports.ts
│   └── useAuth.ts
├── stores/
│   └── formStore.ts             # Zustand form state
├── types/
│   ├── supabase.ts              # Supabase generated types
│   └── index.ts                 # Custom types
└── middleware.ts                # Route koruması
```

---

## Kullanıcı Rolleri ve Yetkileri

| Rol | Değerlendirme Oluştur | Kendi Ekibi | Tüm Ekipler | Raporlar |
|---|---|---|---|---|
| `quality_team` | ✅ | ✅ | ✅ | ✅ |
| `team_leader` | ✅ | ✅ | ❌ | Sadece kendi ekibi |
| `manager` | ❌ | — | ✅ | ✅ Tümü |
| `consultant` | ❌ | — | — | Sadece kendisi |

---

## Form Adımları (Typeform Tarzı Animasyonlu)

Form 6 adımdan oluşur. Her adım tam ekran, dikey slide animasyonuyla geçiş yapar.

### Adım 1 — Temel Bilgiler
- Danışman Adı (dropdown — profiles tablosundan)
- Team Leader (dropdown — profiles tablosundan, role=team_leader)
- Takım / Region (dropdown — teams tablosundan)
- Müşteri Adı (text)
- Lead / Contact / Deal ID (text)
- Görüşme Kanalı (büyük buton seçimi: WhatsApp / Arama)
- Görüşme Tarihi (date picker)
- Değerlendirme Tarihi (date picker, default bugün)
- Değerlendiren Kişi (otomatik — login olan kullanıcı)
- Görüşme Sonucu (dropdown: Won / Open / Follow-up / Lost / No Answer)
- Genel Not (textarea, opsiyonel)

### Adım 2 — Kalite Kriterleri (10 Kriter)
Her kriter için:
- Kriter başlığı ve açıklayıcı alt sorular
- Puan seçimi: 4 büyük kart butonu (0 / 5 / 7 / 10)
- Kriter yorumu textarea (puan 10 değilse zorunlu)
- Sağ üstte canlı toplam skor göstergesi

Kriterler:
1. Karşılama ve İlk İzlenim
2. Kendini ve Kurumu Doğru Tanıtma
3. İhtiyaç Analizi
4. Doğru ve Eksiksiz Bilgilendirme
5. Güven Oluşturma
6. Empati, Ton ve İletişim Kalitesi
7. Satış Odaklı Yönlendirme
8. İtiraz Karşılama
9. Kapanış ve Sonraki Aksiyon
10. CRM, Not ve Takip Disiplini

### Adım 3 — Kanal Özel Soruları
Adım 1'de seçilen kanala göre otomatik değişir.

**WhatsApp seçildiyse (10 soru):**
1. İlk dönüş süresi uygun mu?
2. Mesaj dili profesyonel ve anlaşılır mı?
3. Yazım hatası veya kopyala-yapıştır hissi var mı?
4. Müşterinin sorularına eksiksiz cevap verilmiş mi?
5. Fiyat ve paket bilgisi doğru aktarılmış mı?
6. Gerekli görsel, video veya bilgilendirme içeriği paylaşılmış mı?
7. Takip mesajı atılmış mı?
8. Mesajlar gereksiz uzun veya karmaşık mı?
9. Müşteri arama, ödeme veya randevu aşamasına yönlendirilmiş mi?
10. Görüşme net aksiyonla kapatılmış mı?

**Arama seçildiyse (10 soru):**
1. Danışmanın ses tonu enerjik ve güven verici mi?
2. Müşterinin sözü kesilmeden dinlenmiş mi?
3. Danışman görüşmeye hakim mi?
4. Görüşme satış hedefine doğru yönetilmiş mi?
5. Doğru ihtiyaç analizi soruları sorulmuş mu?
6. İtirazlar profesyonel şekilde karşılanmış mı?
7. Sessizlik, kararsızlık veya konu dağılması doğru yönetilmiş mi?
8. Müşteri uygun zamanda aksiyona yönlendirilmiş mi?
9. Görüşme sonunda özet ve sonraki adım verilmiş mi?
10. Kapanış profesyonel şekilde yapılmış mı?

Her soru için 4 seçenek (büyük toggle butonları):
- Başarılı
- Kısmen Başarılı
- Başarısız
- Uygun Değil

### Adım 4 — Kritik Hatalar
Checkbox listesi (birden fazla seçilebilir):
1. Yanlış fiyat bilgisi verilmesi
2. Yanlış paket veya operasyon bilgisi verilmesi
3. Kesin sonuç garantisi verilmesi
4. Tıbbi olarak yanıltıcı ifade kullanılması
5. Müşteriye kaba veya ilgisiz davranılması
6. Müşterinin sorusunun cevapsız bırakılması
7. Ödeme sürecinin yanlış yönlendirilmesi
8. Randevu veya operasyon tarihinin yanlış aktarılması
9. CRM kaydının hiç işlenmemesi
10. Eksik takip nedeniyle müşteri kaybı riski oluşması

Kritik hata seçilince "Kritik Hata Açıklaması" textarea zorunlu olur.
Canlı skor hesabı gösterilir (kaç kritik hata → max kaç puan alabilir).

### Adım 5 — Satış Başarısı Analizi
6 textarea alanı:
1. Danışman müşterinin satın alma motivasyonunu anlayabildi mi?
2. Müşterinin karar vermesini kolaylaştırdı mı?
3. Satış fırsatı doğru değerlendirildi mi?
4. Görüşme neden Won / Lost / Open kaldı?
5. Danışmanın satışa en çok katkı sağlayan davranışı neydi?
6. Danışmanın satış kaybına sebep olabilecek davranışı neydi?

### Adım 6 — Gelişim ve Aksiyon Planı
- Güçlü Yönler (textarea)
- Geliştirilmesi Gereken Alanlar (textarea)
- Verilecek Koçluk Konusu (textarea)
- Team Leader Yorumu (textarea)
- Danışman Aksiyon Planı (textarea)
- Tekrar Kontrol Tarihi (date picker)

**Form sonu:** Otomatik başarı rozeti gösterilir + kaydet / PDF butonları

---

## Puan Hesaplama Mantığı

```typescript
// lib/scoring.ts içinde implement et

export function calculateFinalScore(
  rawScore: number,          // criteria_scores toplamı (0-100)
  criticalErrorCount: number,
  isAutoFailed: boolean
): number {
  if (isAutoFailed) return 0
  if (criticalErrorCount >= 3) return 0
  if (criticalErrorCount === 2) return Math.min(rawScore, 59)
  if (criticalErrorCount === 1) return Math.min(rawScore, 69)
  return rawScore
}

export function getScoreLevel(score: number) {
  if (score >= 90) return { label: 'Mükemmel', labelEn: 'Excellent',   color: 'green'  }
  if (score >= 80) return { label: 'İyi',       labelEn: 'Good',        color: 'blue'   }
  if (score >= 70) return { label: 'Geliştirilmeli', labelEn: 'Needs Improvement', color: 'yellow' }
  if (score >= 60) return { label: 'Riskli',    labelEn: 'Risky',       color: 'orange' }
  return              { label: 'Başarısız',  labelEn: 'Unsuccessful', color: 'red'   }
}

// Kriter yorumu zorunluluk kuralı
export function isCommentRequired(scoreValue: number): boolean {
  return scoreValue < 10
}
```

---

## Dil Desteği (TR/EN)

- `lib/i18n.ts` dosyasında tüm çeviriler object olarak tutulur
- `localStorage`'da `lang` key'i ile saklanır (`'tr'` veya `'en'`)
- Her sayfada dil toggle butonu bulunur (TR | EN)
- Tüm form metinleri, başlıklar, butonlar, uyarılar çevrilir

---

## Supabase Tablo Özeti

| Tablo | Açıklama |
|---|---|
| `profiles` | Kullanıcılar, roller, takım bağlantısı |
| `teams` | Takım / Region listesi |
| `evaluations` | Ana form verisi |
| `criteria_scores` | 10 kriter puanı (evaluation başına 10 satır) |
| `channel_checks` | WhatsApp veya Arama soruları (10 satır) |
| `critical_errors` | Seçilen kritik hatalar (0-N satır) |

---

## Raporlama Sayfası

Filtreler:
- Tarih aralığı
- Danışman
- Team Leader
- Takım / Region
- Kanal (WhatsApp / Arama)
- Görüşme sonucu
- Skor aralığı (min-max slider)
- Kritik hata var/yok
- Değerlendiren kişi

Rapor bölümleri:
1. **Danışman Bazlı** — ortalama skor tablosu + trend grafik
2. **Kanal Karşılaştırması** — WhatsApp vs Arama bar chart
3. **Kritik Hata Raporu** — hata türü bazlı dağılım
4. **Satış Sonucu vs Kalite** — Won/Lost/Open ortalama skorları

---

## Form Butonları ve Aksiyonlar

| Buton | Aksiyon |
|---|---|
| Kaydet | `status: 'approved'` olarak Supabase'e yaz |
| Taslak Kaydet | `status: 'draft'` olarak yaz, sonra devam edilebilir |
| Temizle | Form state sıfırla, onay sor |
| PDF İndir | @react-pdf/renderer ile client-side PDF |
| Excel'e Aktar | xlsx ile indirme |
| Önizleme | Modal içinde form özeti göster |
| Gönder / Onaya Sun | `status: 'submitted'` olarak kaydet |

---

## Tasarım Prensipleri

- **Renk:** Beyaz zemin, Natural Clinic marka rengi olarak koyu yeşil `#1B4332` ve açık yeşil `#52B788` kullan
- **Font:** Inter (Google Fonts)
- **Form UI:** Typeform/forms.app tarzı — her soru tam ekran, büyük tipografi, temiz boşluklar
- **Animasyon:** Framer Motion, `y: 40 → 0`, `opacity: 0 → 1`, `duration: 0.4s`
- **Mobil:** Önce mobil tasarla, tablet ve desktop'a ölçekle
- **Skor göstergesi:** Forma sağda sabit, canlı güncellenen daire/progress bar
- **Başarı rozeti:** Form sonunda büyük, renkli, animasyonlu badge

---

## Önemli Kurallar

1. Tüm Supabase sorguları `try/catch` ile sarılmalı
2. Loading ve error state her component'ta olmalı
3. Zorunlu alanlar boş geçilemez, form adımları arası geçişte validate et
4. RLS Supabase tarafında zaten var, ama frontend'de de rol kontrolü yap
5. `consultant` rolündeki kullanıcı form göremez, sadece `/dashboard` ve kendi sonuçları
6. TypeScript strict mode — `any` kullanma
7. Her sayfada `<title>` ve meta description olmalı
