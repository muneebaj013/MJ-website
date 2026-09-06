// Supabase Client & Configuration Engine for MJ Store
(function() {
  const STORAGE_KEY_URL = 'mj_supabase_url';
  const STORAGE_KEY_KEY = 'mj_supabase_anon_key';

  // Default / Demo or pre-configured credentials if set
  const DEFAULT_URL = '';
  const DEFAULT_ANON_KEY = '';

  let supabaseClientInstance = null;

  window.MJSupabase = {
    /**
     * Get stored or default Supabase credentials
     */
    getCredentials() {
      try {
        const url = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_URL;
        const anonKey = localStorage.getItem(STORAGE_KEY_KEY) || DEFAULT_ANON_KEY;
        return {
          url: (url || '').trim(),
          anonKey: (anonKey || '').trim()
        };
      } catch (e) {
        return { url: '', anonKey: '' };
      }
    },

    /**
     * Check if valid Supabase credentials are configured
     */
    isConfigured() {
      const creds = this.getCredentials();
      return !!(creds.url && creds.anonKey && creds.url.startsWith('http'));
    },

    /**
     * Save new Supabase credentials and re-initialize client
     */
    saveCredentials(url, anonKey) {
      try {
        if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
        else localStorage.removeItem(STORAGE_KEY_URL);

        if (anonKey) localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
        else localStorage.removeItem(STORAGE_KEY_KEY);

        supabaseClientInstance = null;
        const client = this.getClient(true);
        if (window.MJStorage) {
          window.MJStorage.emit('supabase:config_updated', { configured: this.isConfigured() });
        }
        return { success: true, isConfigured: this.isConfigured(), client };
      } catch (e) {
        console.error('Error saving Supabase credentials:', e);
        return { success: false, message: e.message };
      }
    },

    /**
     * Get initialized Supabase client instance
     */
    getClient(forceRefresh = false) {
      if (supabaseClientInstance && !forceRefresh) {
        return supabaseClientInstance;
      }

      const creds = this.getCredentials();
      if (!creds.url || !creds.anonKey) {
        return null;
      }

      if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        try {
          supabaseClientInstance = window.supabase.createClient(creds.url, creds.anonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
              storage: window.localStorage
            }
          });
          return supabaseClientInstance;
        } catch (e) {
          console.error('Failed to initialize Supabase client:', e);
          return null;
        }
      } else {
        console.warn('Supabase JS library (@supabase/supabase-js) is not yet loaded on window.');
        return null;
      }
    },

    /**
     * Test active connection to Supabase database & auth
     */
    async testConnection() {
      if (!this.isConfigured()) {
        return {
          success: false,
          status: 'not_configured',
          message: 'Supabase URL or Anon Key is missing. Please enter your project details.'
        };
      }

      const client = this.getClient(true);
      if (!client) {
        return {
          success: false,
          status: 'init_failed',
          message: 'Could not initialize Supabase SDK client. Verify the script is loaded.'
        };
      }

      try {
        // Test Auth service reachability
        const { data: authData, error: authError } = await client.auth.getSession();
        if (authError && authError.status >= 500) {
          return {
            success: false,
            status: 'auth_error',
            message: `Authentication check failed: ${authError.message}`
          };
        }

        // Test Database Table reachability (customers table)
        const { data: dbData, error: dbError } = await client
          .from('customers')
          .select('count', { count: 'exact', head: true });

        if (dbError) {
          // If table does not exist yet (code 42P01 or PGRST204), auth is still working!
          if (dbError.code === '42P01' || dbError.message?.includes('does not exist') || dbError.code === 'PGRST204') {
            return {
              success: true,
              tableMissing: true,
              status: 'connected_table_needed',
              message: 'Connected to Supabase! Auth is ready. Please run the SQL schema script in Supabase to create the "customers" table.'
            };
          }
          return {
            success: true,
            status: 'connected_with_db_note',
            message: `Connected to Supabase! (Note: ${dbError.message})`
          };
        }

        return {
          success: true,
          status: 'fully_connected',
          message: 'Successfully connected to Supabase Database & Auth! Ready to register and sign in users.'
        };
      } catch (err) {
        return {
          success: false,
          status: 'network_error',
          message: `Connection error: ${err.message || 'Check project URL and Internet connection.'}`
        };
      }
    },

    /**
     * Generate SQL table creation script ready to paste in Supabase SQL Editor
     */
    getSQLSchema() {
      return `-- ========================================================================
-- MJ E-COMMERCE: SUPABASE DATABASE SCHEMA SETUP
-- Paste and run this script in your Supabase SQL Editor
-- (Supabase Dashboard -> SQL Editor -> New Query -> Run)
-- ========================================================================

-- 1. Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0.00,
    joined_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Orders Table (Optional Live Sync)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    shipping NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT DEFAULT 'Cash on Delivery',
    payment_status TEXT DEFAULT 'Pending',
    order_status TEXT DEFAULT 'Pending',
    items JSONB DEFAULT '[]'::jsonb,
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Public / Authenticated Access
-- Allow anyone to insert/register customer
DROP POLICY IF EXISTS "Public insert customer" ON public.customers;
CREATE POLICY "Public insert customer" ON public.customers
    FOR INSERT WITH CHECK (true);

-- Allow reading customer profiles
DROP POLICY IF EXISTS "Public read customer" ON public.customers;
CREATE POLICY "Public read customer" ON public.customers
    FOR SELECT USING (true);

-- Allow updating customer profiles
DROP POLICY IF EXISTS "Public update customer" ON public.customers;
CREATE POLICY "Public update customer" ON public.customers
    FOR UPDATE USING (true);

-- Allow full access to orders
DROP POLICY IF EXISTS "Public orders access" ON public.orders;
CREATE POLICY "Public orders access" ON public.orders
    FOR ALL USING (true);

-- 5. Auto Trigger to sync new Supabase Auth signups into customers table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customers (auth_id, name, email, phone, address, joined_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    CURRENT_DATE
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    name = COALESCE(EXCLUDED.name, customers.name),
    phone = COALESCE(EXCLUDED.phone, customers.phone),
    address = COALESCE(EXCLUDED.address, customers.address),
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;
    },

    /**
     * Copy SQL schema script to clipboard
     */
    async copySQLSchema() {
      const sql = this.getSQLSchema();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(sql);
          return true;
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = sql;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          return true;
        }
      } catch (err) {
        console.error('Failed to copy SQL schema:', err);
        return false;
      }
    }
  };

  // Initial check and event emission
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.MJSupabase.isConfigured()) {
        window.MJSupabase.getClient();
      }
    });
  }
})();
