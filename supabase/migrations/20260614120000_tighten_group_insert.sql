-- Familieknappen - Fase 1 (F-033): lukk åpen insert på family_groups.
-- Onboarding bruker create_family_group() (SECURITY DEFINER), så klienter
-- trenger ikke å sette inn rader direkte. Uten insert-policy nekter RLS alt.

drop policy if exists family_groups_insert on public.family_groups;
