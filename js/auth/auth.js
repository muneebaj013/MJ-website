// Customer & Admin Authentication Module
(function() {
  const CUSTOMER_SESSION_KEY = 'mj_current_customer';
  const ADMIN_SESSION_KEY = 'mj_admin_session';

  window.MJAuth = {
    // Customer Auth
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

    loginCustomer(email, password) {
      const customers = window.MJStorage.get('customers') || [];
      const cleanEmail = email.toLowerCase().trim();
      
      let customer = customers.find(c => c.email.toLowerCase() === cleanEmail);

      // In real-world client workflow, if customer exists or if demo password supplied
      if (!customer) {
        // Auto register if logging in first time
        customer = {
          id: 'cust-' + Date.now(),
          name: cleanEmail.split('@')[0].replace('.', ' '),
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

      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customer));
      window.MJStorage.emit('auth:customer_login', customer);
      return { success: true, customer };
    },

    registerCustomer(data) {
      const customers = window.MJStorage.get('customers') || [];
      const cleanEmail = data.email.toLowerCase().trim();

      const existing = customers.find(c => c.email.toLowerCase() === cleanEmail);
      if (existing) {
        return { success: false, message: 'An account with this email already exists. Please log in.' };
      }

      const newCustomer = {
        id: 'cust-' + Date.now(),
        name: data.name,
        email: cleanEmail,
        phone: data.phone || '',
        totalOrders: 0,
        totalSpent: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        address: data.address || ''
      };

      customers.push(newCustomer);
      window.MJStorage.set('customers', customers);
      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(newCustomer));
      window.MJStorage.emit('auth:customer_login', newCustomer);

      return { success: true, customer: newCustomer };
    },

    updateCustomerProfile(updates) {
      let customer = this.getCustomer();
      if (!customer) return null;

      const customers = window.MJStorage.get('customers') || [];
      const idx = customers.findIndex(c => c.id === customer.id);
      if (idx !== -1) {
        customers[idx] = { ...customers[idx], ...updates };
        window.MJStorage.set('customers', customers);
        customer = customers[idx];
        localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customer));
        window.MJStorage.emit('auth:customer_updated', customer);
      }
      return customer;
    },

    logoutCustomer() {
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
      window.MJStorage.emit('auth:customer_logout', null);
    },

    // Admin Auth
    getAdminCredentials() {
      try {
        const creds = localStorage.getItem('mj_admin_credentials');
        return creds ? JSON.parse(creds) : { email: 'admin@mjstore.com', password: 'admin123' };
      } catch (e) {
        return { email: 'admin@mjstore.com', password: 'admin123' };
      }
    },

    updateAdminCredentials(newEmail, newPassword) {
      const cleanEmail = newEmail.toLowerCase().trim();
      const updated = {
        email: cleanEmail,
        password: newPassword.trim(),
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

      // Accept saved email, or username 'admin', or 'admin@mjstore.com'
      const isIdentifierMatch = 
        cleanInput === savedEmail || 
        cleanInput === 'admin' || 
        cleanInput === 'admin@mjstore.com' ||
        cleanInput === savedEmail.split('@')[0];

      // Accept saved password or default 'admin123' or 'admin'
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
