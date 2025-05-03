-- Supprimer les tables dépendantes d'abord
DROP TABLE IF EXISTS video_answers CASCADE;
DROP TABLE IF EXISTS interview_monitoring CASCADE;
DROP TABLE IF EXISTS monitoring CASCADE;

-- Supprimer la table interviews
DROP TABLE IF EXISTS interviews CASCADE;

-- Créer la table interviews
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  description TEXT,
  candidate_id TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_questions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'en cours',
  has_attempted_copy_paste BOOLEAN DEFAULT false,
  has_stopped_camera BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table video_answers
CREATE TABLE video_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  url TEXT,
  transcription TEXT,
  question_index INTEGER,
  question_id TEXT,
  question_type TEXT,
  question_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table monitoring
CREATE TABLE monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  has_attempted_copy_paste BOOLEAN DEFAULT false,
  has_stopped_camera BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer l'extension UUID si ce n'est pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Créer les politiques d'accès pour interviews
CREATE POLICY "Enable public read access"
ON interviews FOR SELECT
USING (true);

CREATE POLICY "Enable public insert"
ON interviews FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable public update"
ON interviews FOR UPDATE
USING (true)
WITH CHECK (true);

-- Créer les politiques d'accès pour video_answers
CREATE POLICY "Enable public read access"
ON video_answers FOR SELECT
USING (true);

CREATE POLICY "Enable public insert"
ON video_answers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable public update"
ON video_answers FOR UPDATE
USING (true)
WITH CHECK (true);

-- Créer les politiques d'accès pour monitoring
CREATE POLICY "Enable public read access"
ON monitoring FOR SELECT
USING (true);

CREATE POLICY "Enable public insert"
ON monitoring FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable public update"
ON monitoring FOR UPDATE
USING (true)
WITH CHECK (true); 