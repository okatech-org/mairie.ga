/*
*  Migration: Add extended profile fields for Gabonese registration
*  Description: Adds missing columns for filiation, emergency contact, and employment details.
*/

ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "father_name" text,
ADD COLUMN IF NOT EXISTS "mother_name" text,
ADD COLUMN IF NOT EXISTS "emergency_contact_first_name" text,
ADD COLUMN IF NOT EXISTS "emergency_contact_last_name" text,
ADD COLUMN IF NOT EXISTS "emergency_contact_phone" text,
ADD COLUMN IF NOT EXISTS "employer" text;

comment on column "public"."profiles"."father_name" is 'Nom du père';
comment on column "public"."profiles"."mother_name" is 'Nom de la mère';
comment on column "public"."profiles"."emergency_contact_name" is 'Nom de la personne à contacter en cas d''urgence';
comment on column "public"."profiles"."emergency_contact_phone" is 'Téléphone de la personne à contacter en cas d''urgence';
comment on column "public"."profiles"."employer" is 'Nom de l''employeur ou de l''établissement';
