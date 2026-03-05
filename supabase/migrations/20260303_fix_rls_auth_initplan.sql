-- Fix RLS Auth Initialization Plan warnings
-- Replaces auth.uid() with (select auth.uid()) in all RLS policies
-- This prevents Postgres re-evaluating auth functions for every row scanned
-- which was causing excessive Disk IO usage.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

DO $$
DECLARE
  pol RECORD;
  new_qual text;
  new_with_check text;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND (qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' 
         OR with_check LIKE '%auth.uid()%' OR with_check LIKE '%auth.jwt()%')
  LOOP
    new_qual := CASE WHEN pol.qual IS NOT NULL 
      THEN replace(replace(pol.qual, 'auth.uid()', '(select auth.uid())'), 'auth.jwt()', '(select auth.jwt())')
      ELSE NULL END;
    new_with_check := CASE WHEN pol.with_check IS NOT NULL 
      THEN replace(replace(pol.with_check, 'auth.uid()', '(select auth.uid())'), 'auth.jwt()', '(select auth.jwt())')
      ELSE NULL END;
    
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    
    IF new_qual IS NOT NULL AND new_with_check IS NOT NULL THEN
      EXECUTE format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s USING (%s) WITH CHECK (%s)',
        pol.policyname, pol.schemaname, pol.tablename,
        pol.permissive, pol.cmd, array_to_string(pol.roles, ', '),
        new_qual, new_with_check);
    ELSIF new_qual IS NOT NULL THEN
      EXECUTE format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s USING (%s)',
        pol.policyname, pol.schemaname, pol.tablename,
        pol.permissive, pol.cmd, array_to_string(pol.roles, ', '),
        new_qual);
    ELSE
      EXECUTE format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s WITH CHECK (%s)',
        pol.policyname, pol.schemaname, pol.tablename,
        pol.permissive, pol.cmd, array_to_string(pol.roles, ', '),
        new_with_check);
    END IF;
  END LOOP;
END $$;
