-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON interviews;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON interviews;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON interviews;

-- Créer les nouvelles politiques publiques
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

-- Faire de même pour video_answers
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON video_answers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON video_answers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON video_answers;

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