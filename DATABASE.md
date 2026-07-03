# Natural Clinic QC — Supabase Database Schema

Bu dosyayı Supabase → SQL Editor'e sırayla yapıştır ve çalıştır.
Her bloğu ayrı ayrı çalıştırmak daha güvenlidir.

---

## BLOK 1 — ENUM Tanımları

```sql
-- Kullanıcı rolleri
CREATE TYPE user_role AS ENUM (
  'quality_team',   -- Tüm danışmanlar için değerlendirme yapabilir
  'team_leader',    -- Kendi takımı için değerlendirme yapabilir
  'manager',        -- Sadece raporları görüntüler
  'consultant'      -- Sadece kendi sonuçlarını görür
);

-- Görüşme kanalı
CREATE TYPE channel_type AS ENUM (
  'whatsapp',
  'call'
);

-- Görüşme sonucu
CREATE TYPE conversation_result AS ENUM (
  'won',
  'open',
  'follow_up',
  'lost',
  'no_answer'
);

-- Kriter puanı seçenekleri
CREATE TYPE criteria_score AS ENUM (
  '10',  -- Başarılı
  '7',   -- Küçük eksikler
  '5',   -- Kısmen başarılı
  '0'    -- Başarısız
);

-- Kanal bazlı kontrol sorusu cevabı
CREATE TYPE check_answer AS ENUM (
  'successful',         -- Başarılı
  'partially',          -- Kısmen Başarılı
  'unsuccessful',       -- Başarısız
  'not_applicable'      -- Uygun Değil
);

-- Değerlendirme durumu
CREATE TYPE evaluation_status AS ENUM (
  'draft',      -- Taslak
  'submitted',  -- Gönderildi / Onayda
  'approved',   -- Onaylandı
  'rejected'    -- Reddedildi
);

-- Kritik hata türleri
CREATE TYPE critical_error_type AS ENUM (
  'wrong_price',           -- Yanlış fiyat bilgisi
  'wrong_package',         -- Yanlış paket/operasyon bilgisi
  'result_guarantee',      -- Kesin sonuç garantisi
  'medical_misleading',    -- Tıbbi yanıltıcı ifade
  'rude_behavior',         -- Kaba/ilgisiz davranış
  'unanswered_question',   -- Soruyu cevapsız bırakma
  'wrong_payment_guide',   -- Ödeme süreci yanlış yönlendirme
  'wrong_appointment',     -- Randevu/operasyon tarihi yanlış
  'no_crm_record',         -- CRM kaydı hiç işlenmemiş
  'missed_followup'        -- Eksik takip / müşteri kaybı riski
);
```

---

## BLOK 2 — Ana Tablolar

```sql
-- ─────────────────────────────────────────────
-- TEAMS tablosu
-- ─────────────────────────────────────────────
CREATE TABLE teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,          -- Takım / Region adı
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────
-- PROFILES tablosu (Supabase Auth users tablosunu extend eder)
-- ─────────────────────────────────────────────
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'consultant',
  team_id       UUID REFERENCES teams(id) ON DELETE SET NULL,
  team_leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Danışmanın TL'si
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────
-- EVALUATIONS tablosu (Ana form verisi)
-- ─────────────────────────────────────────────
CREATE TABLE evaluations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Temel bilgiler
  consultant_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  team_leader_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  team_id               UUID REFERENCES teams(id) ON DELETE SET NULL,
  evaluator_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,

  -- Müşteri & görüşme bilgileri
  customer_name         TEXT NOT NULL,
  lead_id               TEXT,                        -- CRM Lead/Contact/Deal ID
  channel               channel_type NOT NULL,
  conversation_date     DATE NOT NULL,
  evaluation_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  conversation_result   conversation_result NOT NULL,
  general_note          TEXT,

  -- Otomatik hesaplanan skorlar
  raw_score             INTEGER NOT NULL DEFAULT 0,  -- Kritik hata öncesi ham puan (0-100)
  final_score           INTEGER NOT NULL DEFAULT 0,  -- Kritik hata sonrası son puan
  critical_error_count  INTEGER NOT NULL DEFAULT 0,
  is_auto_failed        BOOLEAN DEFAULT false,        -- 3+ kritik hata veya direkt başarısız

  -- Durum
  status                evaluation_status DEFAULT 'draft',

  -- Satış analizi (Section 15)
  sales_understood_motivation   TEXT,
  sales_eased_decision          TEXT,
  sales_opportunity_used        TEXT,
  sales_result_reason           TEXT,
  sales_best_behavior           TEXT,
  sales_risk_behavior           TEXT,

  -- Gelişim planı (Section 16)
  dev_strengths           TEXT,
  dev_areas_to_improve    TEXT,
  dev_coaching_topic      TEXT,
  dev_team_leader_comment TEXT,
  dev_consultant_plan     TEXT,
  dev_recheck_date        DATE,

  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────
-- CRITERIA_SCORES tablosu (10 ana kriter puanı)
-- Her evaluation için 10 satır olur
-- ─────────────────────────────────────────────
CREATE TABLE criteria_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id   UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,

  -- Kriter numarası (1-10, PDF Section 8'deki sıraya göre)
  criteria_number INTEGER NOT NULL CHECK (criteria_number BETWEEN 1 AND 10),

  -- Kriter adı (referans için, dil bağımsız enum yerine sabit numara kullanıyoruz)
  -- 1: Karşılama ve İlk İzlenim
  -- 2: Kendini ve Kurumu Doğru Tanıtma
  -- 3: İhtiyaç Analizi
  -- 4: Doğru ve Eksiksiz Bilgilendirme
  -- 5: Güven Oluşturma
  -- 6: Empati, Ton ve İletişim Kalitesi
  -- 7: Satış Odaklı Yönlendirme
  -- 8: İtiraz Karşılama
  -- 9: Kapanış ve Sonraki Aksiyon
  -- 10: CRM, Not ve Takip Disiplini

  score         criteria_score NOT NULL,  -- '0', '5', '7', '10'
  score_value   INTEGER NOT NULL,         -- Hesaplama için integer (0/5/7/10)
  comment       TEXT,                     -- Kriter yorumu (puan 10 değilse zorunlu)

  UNIQUE(evaluation_id, criteria_number)
);

-- ─────────────────────────────────────────────
-- CHANNEL_CHECKS tablosu (WhatsApp veya Arama özel soruları)
-- Her evaluation için 10 satır olur (kanal tipine göre)
-- ─────────────────────────────────────────────
CREATE TABLE channel_checks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id   UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  channel         channel_type NOT NULL,

  -- Soru numarası (1-10, PDF Section 10 veya 11'deki sıraya göre)
  question_number INTEGER NOT NULL CHECK (question_number BETWEEN 1 AND 10),
  answer          check_answer NOT NULL,

  UNIQUE(evaluation_id, question_number)
);

-- ─────────────────────────────────────────────
-- CRITICAL_ERRORS tablosu (Seçilen kritik hatalar)
-- Her evaluation için 0-N satır olur
-- ─────────────────────────────────────────────
CREATE TABLE critical_errors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id   UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  error_type      critical_error_type NOT NULL,
  description     TEXT NOT NULL,  -- Kritik hata açıklaması (zorunlu)
  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(evaluation_id, error_type)
);
```

---

## BLOK 3 — İndeksler (Performans)

```sql
-- Sorgu hızı için kritik indeksler
CREATE INDEX idx_evaluations_consultant    ON evaluations(consultant_id);
CREATE INDEX idx_evaluations_team_leader   ON evaluations(team_leader_id);
CREATE INDEX idx_evaluations_team          ON evaluations(team_id);
CREATE INDEX idx_evaluations_evaluator     ON evaluations(evaluator_id);
CREATE INDEX idx_evaluations_channel       ON evaluations(channel);
CREATE INDEX idx_evaluations_result        ON evaluations(conversation_result);
CREATE INDEX idx_evaluations_status        ON evaluations(status);
CREATE INDEX idx_evaluations_conv_date     ON evaluations(conversation_date);
CREATE INDEX idx_evaluations_final_score   ON evaluations(final_score);
CREATE INDEX idx_criteria_scores_eval      ON criteria_scores(evaluation_id);
CREATE INDEX idx_channel_checks_eval       ON channel_checks(evaluation_id);
CREATE INDEX idx_critical_errors_eval      ON critical_errors(evaluation_id);
CREATE INDEX idx_profiles_role             ON profiles(role);
CREATE INDEX idx_profiles_team             ON profiles(team_id);
```

---

## BLOK 4 — Otomatik Güncelleme (updated_at trigger)

```sql
-- Güncelleme tarihi otomatik güncellensin
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## BLOK 5 — Yeni Kullanıcı Kaydında Profil Oluştur

```sql
-- Supabase Auth'a yeni kullanıcı eklendiğinde profiles tablosuna otomatik kayıt
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'İsimsiz Kullanıcı'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'consultant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## BLOK 6 — Row Level Security (RLS) Politikaları

```sql
-- RLS'yi aktif et
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams           ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_checks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_errors ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES ───────────────────────────────
-- Herkes kendi profilini görebilir
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Manager ve Quality team tüm profilleri görebilir
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('manager', 'quality_team')
    )
  );

-- Team leader kendi takımını görebilir
CREATE POLICY "profiles_select_team"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'team_leader'
      AND profiles.team_id = p.team_id
    )
  );

-- Herkes kendi profilini güncelleyebilir (rol hariç)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─── TEAMS ──────────────────────────────────
CREATE POLICY "teams_select_all"
  ON teams FOR SELECT
  USING (auth.role() = 'authenticated');

-- ─── EVALUATIONS ────────────────────────────
-- Danışman sadece kendi değerlendirmelerini görür
CREATE POLICY "eval_select_consultant"
  ON evaluations FOR SELECT
  USING (
    consultant_id = auth.uid()
  );

-- Team leader kendi takımının değerlendirmelerini görür
CREATE POLICY "eval_select_team_leader"
  ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'team_leader'
      AND evaluations.team_id = p.team_id
    )
  );

-- Quality team ve Manager tüm değerlendirmeleri görür
CREATE POLICY "eval_select_all"
  ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('quality_team', 'manager')
    )
  );

-- Quality team ve Team leader değerlendirme oluşturabilir
CREATE POLICY "eval_insert"
  ON evaluations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('quality_team', 'team_leader')
    )
  );

-- Quality team ve oluşturan kişi güncelleyebilir
CREATE POLICY "eval_update"
  ON evaluations FOR UPDATE
  USING (
    evaluator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'quality_team'
    )
  );

-- ─── ALT TABLOLAR (criteria_scores, channel_checks, critical_errors) ──
-- Evaluation'ı görebiliyorsan bunları da görebilirsin

CREATE POLICY "criteria_select"
  ON criteria_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = criteria_scores.evaluation_id
    )
  );

CREATE POLICY "criteria_insert"
  ON criteria_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = criteria_scores.evaluation_id
      AND (e.evaluator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role = 'quality_team'
        )
      )
    )
  );

CREATE POLICY "criteria_update"
  ON criteria_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = criteria_scores.evaluation_id
      AND (e.evaluator_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role = 'quality_team'
        )
      )
    )
  );

-- Aynı politikayı channel_checks için uygula
CREATE POLICY "channel_select"
  ON channel_checks FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM evaluations e WHERE e.id = channel_checks.evaluation_id)
  );

CREATE POLICY "channel_insert"
  ON channel_checks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = channel_checks.evaluation_id
      AND (e.evaluator_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'quality_team'))
    )
  );

CREATE POLICY "channel_update"
  ON channel_checks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = channel_checks.evaluation_id
      AND (e.evaluator_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'quality_team'))
    )
  );

-- critical_errors için aynısı
CREATE POLICY "critical_select"
  ON critical_errors FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM evaluations e WHERE e.id = critical_errors.evaluation_id)
  );

CREATE POLICY "critical_insert"
  ON critical_errors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = critical_errors.evaluation_id
      AND (e.evaluator_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'quality_team'))
    )
  );

CREATE POLICY "critical_update"
  ON critical_errors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = critical_errors.evaluation_id
      AND (e.evaluator_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'quality_team'))
    )
  );
```

---

## BLOK 7 — Seed Data (Test için)

```sql
-- Test takımları
INSERT INTO teams (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'İstanbul Ekibi'),
  ('22222222-2222-2222-2222-222222222222', 'Ankara Ekibi'),
  ('33333333-3333-3333-3333-333333333333', 'Online Ekibi');

-- NOT: Kullanıcıları Supabase Auth üzerinden oluştur,
-- profiles tablosu trigger ile otomatik dolar.
-- Sonra roller ve takımları şöyle güncelle:

-- UPDATE profiles SET role = 'manager',      team_id = null   WHERE email = 'manager@naturalclinic.com';
-- UPDATE profiles SET role = 'quality_team', team_id = '11111111-...' WHERE email = 'quality@naturalclinic.com';
-- UPDATE profiles SET role = 'team_leader',  team_id = '11111111-...' WHERE email = 'tl@naturalclinic.com';
-- UPDATE profiles SET role = 'consultant',   team_id = '11111111-...', team_leader_id = '...' WHERE email = 'danisman@naturalclinic.com';
```

---

## BLOK 8 — TypeScript Tiplerini Export Et

Tabloları oluşturduktan sonra terminalde şunu çalıştır:

```bash
npx supabase gen types typescript \
  --project-id YOUR_PROJECT_ID \
  --schema public \
  > src/types/supabase.ts
```

`YOUR_PROJECT_ID` → Supabase Dashboard → Settings → General → Project ID

---

## Tablo Özeti

| Tablo | Açıklama | Satır başına |
|---|---|---|
| `teams` | Takım / Region listesi | Sabit (az sayıda) |
| `profiles` | Kullanıcılar + roller | 1 / kullanıcı |
| `evaluations` | Ana değerlendirme formu | 1 / görüşme |
| `criteria_scores` | 10 kriter puanı | 10 / evaluation |
| `channel_checks` | WhatsApp veya Arama soruları | 10 / evaluation |
| `critical_errors` | Seçilen kritik hatalar | 0-10 / evaluation |

**Toplam 6 tablo.** Basit, normalize, genişletilebilir.

---

## Puan Hesaplama Mantığı (Frontend'de yapılacak)

```
ham_puan = criteria_scores toplamı (max 100)

kritik_hata_sayısı = critical_errors.count

son_puan = 
  eğer is_auto_failed = true        → 0 (direkt başarısız)
  eğer kritik_hata_sayısı >= 3      → 0 (başarısız)
  eğer kritik_hata_sayısı = 2       → min(ham_puan, 59)
  eğer kritik_hata_sayısı = 1       → min(ham_puan, 69)
  değilse                            → ham_puan

başarı_seviyesi =
  90-100 → Mükemmel (yeşil)
  80-89  → İyi (mavi)
  70-79  → Geliştirilmeli (sarı)
  60-69  → Riskli (turuncu)
  0-59   → Başarısız (kırmızı)
```
