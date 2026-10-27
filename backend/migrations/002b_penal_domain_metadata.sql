-- Tag domaine penal sur le code penal indexe (metadata chunks)

UPDATE legal_chunks c
SET metadata = COALESCE(c.metadata, '{}'::jsonb) || '{"domaine": "penal"}'::jsonb
FROM legal_documents d
WHERE c.document_id = d.id
  AND (
    d.title ILIKE '%penal%'
    OR d.title ILIKE '%pénal%'
    OR d.source_ref ILIKE '%2015-010%'
  );
