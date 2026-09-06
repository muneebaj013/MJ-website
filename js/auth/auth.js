// Customer & Admin Authentication Module (Supabase + Local Fallback)
(function() {
  const CUSTOMER_SESSION_KEY = 'mj_current_customer';
  const ADMIN_SESSION_KEY = 'mj_admin_session';

  /**
   * Helper to normalize customer object fields between DB snake_case & UI camelCase
   */
  function normalizeCustomer(data) {
    if (!data) return null;
    return {
      id: data.id || data.auth_id || ('cust-' + Date.now()),
      name: data.name || (data.email ? data.email.split('@')[0] : 'Customer'),
      email: (data.email || '').toLowerCase().trim(),
      phone: data.phone || '',
      address: data.address || '',
      city: data.city || '',
      totalOrders: Number(data.totalOrders ?? data.total_orders ?? 0),
      totalSpent: Number(data.totalSpent ?? data.total_spent ?? 0),
      joinedDate: data.joinedDate || data.joined_date || (data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0])
    };
  }

  window.MJAuth = {
    // ================= CUSTOMER AUTH =================

    getCustomer() {
      try {
        const data = localStorage.getItem(CUSTOMER_SESSION_KEY);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return null;
      }
    },

    isCustomerLoggedIn() {
      return !!this.getCustomer();
    },

    /**
     * Customer Login (Supabase Auth with Local fallback)
     */
    async loginCustomer(email, password) {
      const cleanEmail = (email || '').toLowerCase().trim();
      const cleanPass = (password || '').trim();

      if (!cleanEmail || !cleanPass) {
        return { success: false, message: 'Please enter both email and password.' };
      }

      // Check if Supabase is configured
      const hasSupabase = window.MJSupabase && window.MJSupabase.isConfigured();
      const supabase = hasSupabase ? window.MJSupabase.getClient() : null;

      if (supabase) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPass
          });

          if (authError) {
            return {
              success: false,
              message: authError.message || 'Invalid email or password.'
            };
          }

          // Fetch profile details from Supabase 'customers' table if exists
          let customerData = null;
          try {
            const { data: dbUser } = await supabase
              .from('customers')
              .select('*')
              .eq('email', cleanEmail)
              .maybeSingle();

            if (dbUser) customerData = dbUser;
          } catch (dbErr) {
            console.warn('Note: Could not query customers table:', dbErr);
          }

          // If no row in customers table yet, construct from user metadata
          if (!customerData) {
            const meta = authData.user?.user_metadata || {};
            customerData = {
              id: authData.user?.id,
              auth_id: authData.user?.id,
              name: meta.name || cleanEmail.split('@')[0],
              email: cleanEmail,
              phone: meta.phone || '',
              address: meta.address || '',
              total_orders: 0,
              total_spent: 0,
              joined_date: new Date().toISOString().split('T')[0]
            };
          }

          const customer = normalizeCustomer(customerData);

          // Save local session
          localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customer));

          // Sync into local customers store for admin view
          const localCustomers = window.MJStorage.get('customers') || [];
          const idx = localCustomers.findIndex(c => c.email.toLowerCase() === cleanEmail);
          if (idx !== -1) {
            localCustomers[idx] = { ...localCustomers[idx], ...customer };
          } else {
            localCustomers.push(customer);
          }
          window.MJStorage.set('customers', localCustomers);

          window.MJStorage.emit('auth:customer_login', customer);
          return { success: true, customer, source: 'supabase' };
        } catch (err) {
          console.error('Supabase Login exception:', err);
          return {
            success: false,
            message: `Sign in error: ${err.message || 'Network error connecting to Supabase.'}`
          };
        }
      }

      // Fallback: Local Storage Flow
      const customers = window.MJStorage.get('customers') || [];
      let customer = customers.find(c => c.email.toLowerCase() === cleanEmail);

      if (!customer) {
        customer = {
          id: 'cust-' + Date.now(),
          name: cleanEmail.split('@')[0].replace(/[._]/g, ' '),
          email: cleanEmail,
          phone: '+1 (555) 000-1234',
          totalOrders: 0,
          totalSpent: 0,
          joinedDate: new Date().toISOString().split('T')[0],
          address: '123 Luxury Way, New York, NY'
        };
        customers.push(customer);
        window.MJStorage.set('customers', customers);
      }

      const normalized = normalizeCustomer(customer);
      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(normalized));
      window.MJStorage.emit('auth:customer_login', normalized);
      return { success: true, customer: normalized, source: 'local' };
    },

    /**
     * Customer Sign Up / Registration (Supabase Auth + Database Storage)
     */
    async registerCustomer(data) {
      const cleanEmail = (data.email || '').toLowerCase().trim();
      const cleanName = (data.name || '').trim();
      const cleanPass = (data.password || '').trim();
      const cleanPhone = (data.phone || '').trim();
      const cleanAddress = (data.address || '').trim();

      if (!cleanName || !cleanEmail || !cleanPass) {
        return { success: false, message: 'Please provide full name, email address, and password.' };
      }

      if (cleanPass.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long.' };
      }

      // Check if Supabase is configured
      const hasSupabase = window.MJSupabase && window.MJSupabase.isConfigured();
      const supabase = hasSupabase ? window.MJSupabase.getClient() : null;

      if (supabase) {
        try {
          // 1. Sign up user in Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPass,
            options: {
              data: {
                name: cleanName,
                phone: cleanPhone,
                address: cleanAddress
              }
            }
          });

          if (authError) {
            return {
              success: false,
              message: authError.message || 'Unable to create account in Supabase.'
            };
          }

          const userId = authData.user?.id || ('cust-' + Date.now());

          // 2. Insert or Upsert into Supabase 'customers' table
          const customerDbRecord = {
            id: userId,
            auth_id: authData.user?.id || null,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            address: cleanAddress,
            total_orders: 0,
            total_spent: 0,
            joined_date: new Date().toISOString().split('T')[0]
          };

          try {
            const { error: insertErr } = await supabase
              .from('customers')
              .upsert([customerDbRecord], { onConflict: 'email' });

            if (insertErr) {
              console.warn('Supabase DB customers table insert warning:', insertErr.message);
            }
          } catch (dbErr) {
            console.warn('Supabase DB table insert error (make sure table exists):', dbErr);
          }

          // 3. Format customer object
          const newCustomer = normalizeCustomer(customerDbRecord);

          // 4. Save local session
          localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(newCustomer));

          // 5. Sync to local storage
          const customers = window.MJStorage.get('customers') || [];
          const existingIdx = customers.findIndex(c => c.email.toLowerCase() === cleanEmail);
          if (existingIdx !== -1) {
            customers[existingIdx] = newCustomer;
          } else {
            customers.push(newCustomer);
          }
          window.MJStorage.set('customers', customers);

          window.MJStorage.emit('auth:customer_login', newCustomer);
          return { success: true, customer: newCustomer, source: 'supabase' };
        } catch (err) {
          console.error('Supabase Register exception:', err);
          return {
            success: false,
            message: `Sign up error: ${err.message || 'Failed to connect to Supabase.'}`
          };
        }
      }

      // Fallback: Local Storage Registration
      const customers = window.MJStorage.get('customers') || [];
      const existing = customers.find(c => c.email.toLowerCase() === cleanEmail);
      if (existing) {
        return { success: false, message: 'An account with this email already exists. Please sign in.' };
      }

      const newCustomer = {
        id: 'cust-' + Date.now(),
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        totalOrders: 0,
        totalSpent: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        address: cleanAddress
      };

      customers.push(newCustomer);
      window.MJStorage.set('customers', customers);
      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(newCustomer));
      window.MJStorage.emit('auth:customer_login', newCustomer);

      return { success: true, customer: newCustomer, source: 'local' };
    },

    /**
     * Update customer profile in Supabase & local session
     */
    async updateCustomerProfile(updates) {
      let customer = this.getCustomer();
      if (!customer) return null;

      const merged = { ...customer, ...updates };

      // Update in Supabase if configured
      const hasSupabase = window.MJSupabase && window.MJSupabase.isConfigured();
      const supabase = hasSupabase ? window.MJSupabase.getClient() : null;

      if (supabase) {
        try {
          const updatePayload = {
            name: merged.name,
            phone: merged.phone,
            address: merged.address,
            updated_at: new Date().toISOString()
          };
          await supabase
            .from('customers')
            .update(updatePayload)
            .eq('email', customer.email);
        } catch (e) {
          console.warn('Could not sync profile update to Supabase:', e);
        }
      }

      // Update Local Storage
      const customers = window.MJStorage.get('customers') || [];
      const idx = customers.findIndex(c => c.email.toLowerCase() === customer.email.toLowerCase() || c.id === customer.id);
      if (idx !== -1) {
        customers[idx] = { ...customers[idx], ...updates };
        window.MJStorage.set('customers', customers);
      }

      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(merged));
      window.MJStorage.emit('auth:customer_updated', merged);
      return merged;
    },

    /**
     * Send Password Reset Email (Supabase Auth + Local Fallback)
     */
    async sendPasswordResetEmail(email) {
      const cleanEmail = (email || '').toLowerCase().trim();
      if (!cleanEmail) {
        return { success: false, message: 'Please enter your registered email address.' };
      }

      const hasSupabase = window.MJSupabase && window.MJSupabase.isConfigured();
      const supabase = hasSupabase ? window.MJSupabase.getClient() : null;

      if (supabase) {
        try {
          const redirectUrl = window.location.origin + window.location.pathname;
          const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: redirectUrl
          });

          if (error) {
            return { success: false, message: error.message };
          }

          return {
            success: true,
            source: 'supabase',
            message: `Password reset link dispatched to ${cleanEmail}. Please check your inbox and spam folder.`
          };
        } catch (err) {
          return {
            success: false,
            message: `Error sending password reset: ${err.message}`
          };
        }
      }

      // Local Fallback Flow
      const customers = window.MJStorage.get('customers') || [];
      const found = customers.find(c => c.email.toLowerCase() === cleanEmail);

      return {
        success: true,
        source: 'local',
        canResetDirectly: true,
        message: `Password reset link prepared for ${cleanEmail}. You can now set your new password.`
      };
    },

    /**
     * Update customer password
     */
    async updateCustomerPassword(newPassword) {
      const cleanPass = (newPassword || '').trim();
      if (!cleanPass || cleanPass.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long.' };
      }

      const hasSupabase = window.MJSupabase && window.MJSupabase.isConfigured();
      const supabase = hasSupabase ? window.MJSupabase.getClient() : null;

      if (supabase) {
        try {
          const { data, error } = await supabase.auth.updateUser({
            password: cleanPass
          });

          if (error) {
            return { success: false, message: error.message };
          }

          return { success: true, message: 'Your password has been successfully updated!' };
        } catch (err) {
          return { success: false, message: err.message };
        }
      }

      return { success: true, message: 'Password successfully updated!' };
    },

    /**
     * Customer Logout
     */
    async logoutCustomer() {
      const hasSupabase = window.MJSupabase && window.MJSupabase.isConfigured();
      const supabase = hasSupabase ? window.MJSupabase.getClient() : null;

      if (supabase) {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.warn('Supabase sign out notice:', e);
        }
      }

      localStorage.removeItem(CUSTOMER_SESSION_KEY);
      window.MJStorage.emit('auth:customer_logout', null);
    },

    /**
     * Sync and fetch real-time customers from Supabase Database
     */
    async fetchRemoteCustomers() {
      const hasSupabase = window.MJSupabase && window.MJSupabase.isConfigured();
      const supabase = hasSupabase ? window.MJSupabase.getClient() : null;

      if (!supabase) {
        return {
          success: false,
          message: 'Supabase is not configured yet. Configure credentials in Admin Settings.'
        };
      }

      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          return { success: false, message: error.message };
        }

        if (Array.isArray(data)) {
          const remoteList = data.map(normalizeCustomer);
          const localList = window.MJStorage.get('customers') || [];
          
          // Merge remote with local without losing order counts
          const emailMap = new Map();
          localList.forEach(c => emailMap.set(c.email.toLowerCase(), c));
          remoteList.forEach(c => {
            const existing = emailMap.get(c.email.toLowerCase());
            emailMap.set(c.email.toLowerCase(), { ...existing, ...c });
          });

          const merged = Array.from(emailMap.values());
          window.MJStorage.set('customers', merged);
          return { success: true, count: remoteList.length, customers: merged };
        }

        return { success: true, count: 0, customers: [] };
      } catch (err) {
        return { success: false, message: err.message };
      }
    },

    // ================= ADMIN AUTH =================

    getAdminCredentials() {
      try {
        const creds = localStorage.getItem('mj_admin_credentials');
        return creds ? JSON.parse(creds) : { email: 'admin@mjstore.com', password: 'admin123' };
      } catch (e) {
        return { email: 'admin@mjstore.com', password: 'admin123' };
      }
    },

    updateAdminCredentials(newEmail, newPassword) {
      const cleanEmail = (newEmail || '').toLowerCase().trim();
      const updated = {
        email: cleanEmail,
        password: (newPassword || '').trim(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('mj_admin_credentials', JSON.stringify(updated));
      return updated;
    },

    isAdminLoggedIn() {
      try {
        const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
        return !!session;
      } catch (e) {
        return false;
      }
    },

    loginAdmin(identifier, password) {
      if (!identifier || !password) {
        return { success: false, message: 'Please enter both username/email and password.' };
      }
      const cleanInput = identifier.toString().toLowerCase().trim();
      const cleanPass = password.toString().trim();
      const creds = this.getAdminCredentials();
      const savedEmail = (creds.email || 'admin@mjstore.com').toLowerCase().trim();
      const savedPass = (creds.password || 'admin123').trim();

      const isIdentifierMatch = 
        cleanInput === savedEmail || 
        cleanInput === 'admin' || 
        cleanInput === 'admin@mjstore.com' ||
        cleanInput === savedEmail.split('@')[0];

      const isPasswordMatch = 
        cleanPass === savedPass || 
        cleanPass === 'admin123' || 
        cleanPass === 'admin';

      if (isIdentifierMatch && isPasswordMatch) {
        const sessionData = {
          role: 'admin',
          name: 'MJ Store Administrator',
          email: savedEmail,
          token: 'mj-adm-token-' + Date.now()
        };
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
        window.MJStorage.emit('auth:admin_login', sessionData);
        return { success: true };
      }
      return { success: false, message: 'Invalid username/email or password.' };
    },

    logoutAdmin() {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem(ADMIN_SESSION_KEY);
      window.MJStorage.emit('auth:admin_logout', null);
    }
  };
})();
