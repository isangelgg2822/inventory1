// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ofifakjwgsypbmhjdror.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9maWZha2p3Z3N5cGJtaGpkcm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMjEyNTAsImV4cCI6MjA1OTY5NzI1MH0.U61HBSgqLYYE3Fl4PIXTGpnIcBL9-fJtCVlZ6ETwmdU';

export const supabase = createClient(supabaseUrl, supabaseKey);

