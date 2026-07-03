-- ═══════════════════════════════════════════════════════════════════
-- Natural Clinic QC — Tam Veritabanı Şeması
-- Supabase SQL Editor'da bir kerede çalıştırın.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Enum Tipleri ────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('quality_team', 'team_leader', 'manager', 'consultant');
CREATE TYPE channel_type AS ENUM ('whatsapp', 'call');
CREATE TYPE conversation_result AS ENUM ('won', 'open', 'follow_up', 'lost', 'no_answer');
CREATE TYPE criteria_score AS ENUM ('10', '7', '5', '0');
CREATE TYPE check_answer AS ENUM ('successful', 'partially', 'unsuccessful', 'not_applicable');
CREATE TYPE evaluation_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
CREATE TYPE critical_error_type AS ENUM (
  'wrong_price', 'wrong_package', 'result_guarantee', 'medical_misleading',
  'rude_behavior', 'unanswered_question', 'wrong_payment_guide', 'wrong_appointment',
  'no_crm_record', 'missed_followup'
);

-- ── 2. Takımlar ────────────────────────────────────────────────────

CREATE TABLE teams (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Profiller ───────────────────────────────────────────────────

CREATE TABLE profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  email          TEXT NOT NULL,
  role           user_role NOT NULL DEFAULT 'consultant',
  team_id        UUID REFERENCES teams(id),
  team_leader_id UUID REFERENCES profiles(id),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Yardımcı fonksiyonlar ───────────────────────────────────────

-- updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Yeni kullanıcı kaydında profil otomatik oluştur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'consultant')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 5. Değerlendirmeler ────────────────────────────────────────────

CREATE TABLE evaluations (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id              UUID NOT NULL REFERENCES profiles(id),
  team_leader_id             UUID REFERENCES profiles(id),
  team_id                    UUID REFERENCES teams(id),
  evaluator_id               UUID NOT NULL REFERENCES profiles(id),
  customer_name              TEXT NOT NULL,
  lead_id                    TEXT,
  channel                    channel_type NOT NULL,
  conversation_date          DATE NOT NULL,
  evaluation_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  conversation_result        conversation_result NOT NULL,
  general_note               TEXT,
  raw_score                  NUMERIC NOT NULL DEFAULT 0,
  final_score                NUMERIC NOT NULL DEFAULT 0,
  critical_error_count       INTEGER NOT NULL DEFAULT 0,
  is_auto_failed             BOOLEAN NOT NULL DEFAULT FALSE,
  status                     evaluation_status NOT NULL DEFAULT 'draft',
  -- Satış analizi (Step 5)
  sales_understood_motivation TEXT,
  sales_eased_decision        TEXT,
  sales_opportunity_used      TEXT,
  sales_result_reason         TEXT,
  sales_best_behavior         TEXT,
  sales_risk_behavior         TEXT,
  -- Gelişim planı (Step 6)
  dev_strengths               TEXT,
  dev_areas_to_improve        TEXT,
  dev_coaching_topic          TEXT,
  dev_team_leader_comment     TEXT,
  dev_consultant_plan         TEXT,
  dev_recheck_date            DATE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── 6. Kriter Puanları ─────────────────────────────────────────────

CREATE TABLE criteria_scores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id  UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  criteria_number INTEGER NOT NULL,
  score          criteria_score NOT NULL,
  score_value    INTEGER NOT NULL,
  comment        TEXT
);

-- ── 7. Kanal Kontrolleri ───────────────────────────────────────────

CREATE TABLE channel_checks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id   UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  channel         channel_type NOT NULL,
  question_number INTEGER NOT NULL,
  answer          check_answer NOT NULL
);

-- ── 8. Kritik Hatalar ─────────────────────────────────────────────

CREATE TABLE critical_errors (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id  UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  error_type     critical_error_type NOT NULL,
  description    TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 9. İndeksler ──────────────────────────────────────────────────

CREATE INDEX idx_evaluations_consultant_id    ON evaluations(consultant_id);
CREATE INDEX idx_evaluations_team_id          ON evaluations(team_id);
CREATE INDEX idx_evaluations_status           ON evaluations(status);
CREATE INDEX idx_evaluations_conversation_date ON evaluations(conversation_date);
CREATE INDEX idx_criteria_scores_eval         ON criteria_scores(evaluation_id);
CREATE INDEX idx_channel_checks_eval          ON channel_checks(evaluation_id);
CREATE INDEX idx_critical_errors_eval         ON critical_errors(evaluation_id);

-- ── 10. Row Level Security ─────────────────────────────────────────

ALTER TABLE teams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_checks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_errors ENABLE ROW LEVEL SECURITY;

-- Teams: tüm authenticated kullanıcılar okuyabilir
CREATE POLICY "teams_select" ON teams FOR SELECT TO authenticated USING (true);

-- Profiles: tüm authenticated kullanıcılar okuyabilir
CREATE POLICY "profiles_select"   ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert"   ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update"   ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Evaluations
CREATE POLICY "evaluations_select" ON evaluations FOR SELECT TO authenticated USING (
  consultant_id = auth.uid()
  OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('quality_team', 'team_leader', 'manager')
);
CREATE POLICY "evaluations_insert" ON evaluations FOR INSERT TO authenticated WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('quality_team', 'team_leader')
);
CREATE POLICY "evaluations_update" ON evaluations FOR UPDATE TO authenticated USING (
  evaluator_id = auth.uid()
  OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('quality_team', 'manager')
);
CREATE POLICY "evaluations_delete" ON evaluations FOR DELETE TO authenticated USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'quality_team'
);

-- Alt tablolar: tüm authenticated kullanıcılar (service role zaten bypass eder)
CREATE POLICY "criteria_scores_all"  ON criteria_scores  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "channel_checks_all"   ON channel_checks   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "critical_errors_all"  ON critical_errors  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 11. Demo Takım ────────────────────────────────────────────────

INSERT INTO teams (name) VALUES ('Satış Takımı A');
