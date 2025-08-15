import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ybhrdjkfmticopeorkmv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliaHJkamtmbXRpY29wZW9ya212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTE5NjQsImV4cCI6MjA3MDgyNzk2NH0.crBVNVfvmZLmn0LJd63Z0ve_1M2diJOp3i0CK_5YHpU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);