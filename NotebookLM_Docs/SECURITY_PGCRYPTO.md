# Selective Column Encryption (pgcrypto)

Date: 2025-09-09

This document explains the selective column encryption implemented for sensitive user profile fields using PostgreSQL `pgcrypto`.

## Overview
- Symmetric encryption via `pgp_sym_encrypt` (PostgreSQL `pgcrypto` extension)
- Encrypted bytea columns mirror selected plaintext fields to preserve compatibility
- Encryption occurs during migration (backfill) and on each save via a post-save signal

## Encrypted Fields
- `authentication_user.illness_enc`
- `authentication_user.existing_medical_condition_enc`
- `authentication_user.medications_enc`
- `authentication_user.allergies_enc`
- `authentication_user.emergency_contact_number_enc`

Plaintext counterparts remain for application continuity. Future work can migrate reads to decrypted values and scrub plaintext after verification.

## Configuration
- Env var: `PGP_ENCRYPTION_KEY="<strong symmetric key>"`
- Django setting: `PGP_ENCRYPTION_KEY` (read from env)

## Migration & Backfill
- Migration `authentication/0004_add_dentist_role_and_pgcrypto_fields.py`:
  - Enables `pgcrypto` (Postgres only)
  - Adds encrypted columns
  - Backfills ciphertext for existing rows when `PGP_ENCRYPTION_KEY` is present

## Runtime Encryption
- `authentication/signals.py` post-save signal updates `*_enc` with `pgp_sym_encrypt` for any non-empty plaintext field values.

## Verification (PostgreSQL)
```sql
-- Check encrypted bytes present
SELECT id, octet_length(allergies_enc) AS enc_len
FROM authentication_user
WHERE allergies IS NOT NULL LIMIT 5;

-- Decrypt sample (replace with your key)
SELECT pgp_sym_decrypt(allergies_enc, '<your-key>')
FROM authentication_user
WHERE allergies_enc IS NOT NULL LIMIT 1;
```

## Key Rotation (Suggested Process)
1. Add `PGP_ENCRYPTION_KEY_NEW` to env
2. Run a one-off script to re-encrypt each `*_enc` using `pgp_sym_decrypt(old_key)` -> `pgp_sym_encrypt(new_key)`
3. Swap keys in settings/env; remove old key when complete

## Notes
- On SQLite or databases without `pgcrypto`, encryption is silently skipped (no failure) to keep development flow unblocked
- Do not log ciphertext or keys; ensure admin tooling hides encrypted fields where not needed

