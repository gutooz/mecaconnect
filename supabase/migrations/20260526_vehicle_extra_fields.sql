-- Migration: campos extras em vehicles + bucket de fotos
-- Execute no SQL Editor do seu projeto Supabase (ltaoipqgowdpbsfmwiaa)

-- 1. Novos campos na tabela vehicles
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS renavam          text,
  ADD COLUMN IF NOT EXISTS last_oil_change  date,
  ADD COLUMN IF NOT EXISTS next_revision_at date,
  ADD COLUMN IF NOT EXISTS tires            text;

-- 2. Bucket público para fotos de veículos
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-photos', 'vehicle-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas do bucket (DROP antes para evitar erro de duplicata)
DROP POLICY IF EXISTS "vehicle_photos_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "vehicle_photos_auth_insert"  ON storage.objects;
DROP POLICY IF EXISTS "vehicle_photos_auth_delete"  ON storage.objects;

-- Leitura pública
CREATE POLICY "vehicle_photos_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'vehicle-photos');

-- Upload apenas para usuários autenticados
CREATE POLICY "vehicle_photos_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'vehicle-photos');

-- Deletar apenas por autenticados
CREATE POLICY "vehicle_photos_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'vehicle-photos');
