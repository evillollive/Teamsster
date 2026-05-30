-- Add the relationship_type enum and structured columns to player_contacts.
-- The schema already defines these, but no prior migration added them.

DO $$ BEGIN
  CREATE TYPE "relationship_type" AS ENUM ('parent', 'guardian', 'stepparent', 'grandparent', 'sibling', 'coach', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "player_contacts"
  ADD COLUMN IF NOT EXISTS "relationship_type" "relationship_type",
  ADD COLUMN IF NOT EXISTS "custom_relationship" text;

-- Backfill legacy free-text relationship values into the structured
-- relationship_type and custom_relationship columns.
-- Uses the same synonym mapping as normalizeRelationship() in schema.ts.

UPDATE player_contacts
SET
  relationship_type = (CASE lower(trim(relationship))
    WHEN 'mom' THEN 'parent'
    WHEN 'mother' THEN 'parent'
    WHEN 'dad' THEN 'parent'
    WHEN 'father' THEN 'parent'
    WHEN 'parent' THEN 'parent'
    WHEN 'guardian' THEN 'guardian'
    WHEN 'legal guardian' THEN 'guardian'
    WHEN 'stepparent' THEN 'stepparent'
    WHEN 'step-parent' THEN 'stepparent'
    WHEN 'stepmom' THEN 'stepparent'
    WHEN 'step-mom' THEN 'stepparent'
    WHEN 'step mom' THEN 'stepparent'
    WHEN 'stepdad' THEN 'stepparent'
    WHEN 'step-dad' THEN 'stepparent'
    WHEN 'step dad' THEN 'stepparent'
    WHEN 'stepmother' THEN 'stepparent'
    WHEN 'stepfather' THEN 'stepparent'
    WHEN 'grandparent' THEN 'grandparent'
    WHEN 'grandma' THEN 'grandparent'
    WHEN 'grandmother' THEN 'grandparent'
    WHEN 'grandpa' THEN 'grandparent'
    WHEN 'grandfather' THEN 'grandparent'
    WHEN 'nana' THEN 'grandparent'
    WHEN 'nanny' THEN 'grandparent'
    WHEN 'sibling' THEN 'sibling'
    WHEN 'brother' THEN 'sibling'
    WHEN 'sister' THEN 'sibling'
    WHEN 'coach' THEN 'coach'
    ELSE 'other'
  END)::relationship_type,
  custom_relationship = CASE
    WHEN lower(trim(relationship)) IN (
      'mom', 'mother', 'dad', 'father', 'parent',
      'guardian', 'legal guardian',
      'stepparent', 'step-parent', 'stepmom', 'step-mom', 'step mom',
      'stepdad', 'step-dad', 'step dad', 'stepmother', 'stepfather',
      'grandparent', 'grandma', 'grandmother', 'grandpa', 'grandfather', 'nana', 'nanny',
      'sibling', 'brother', 'sister',
      'coach'
    ) THEN NULL
    ELSE trim(relationship)
  END
WHERE relationship IS NOT NULL
  AND relationship_type IS NULL
  AND deleted_at IS NULL;

-- Safety net: set remaining NULL relationship_type to 'other'
UPDATE player_contacts
SET relationship_type = 'other'::relationship_type
WHERE relationship_type IS NULL
  AND deleted_at IS NULL;
