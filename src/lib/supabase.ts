import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zfcsngwhcikbpewreqkx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_24Eqz52ucvL8GGPzLO3wMQ_ukpM9Ox7';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
