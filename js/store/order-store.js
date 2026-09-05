// Order Store Module
(function() {
  window.MJOrderStore = {
    getAll() {
      return window.MJStorage.get('orders') || [];
    },

    getById(orderId) {
      if (!orderId) return null;
      const cleanId = orderId.toString().trim().toUpperCase();
      return this.getAll().find(o => o.id.toUpperCase() === cleanId || o.trackingNumber === cleanId) || null;
    },

    getByCustomerEmail(email) {
      if (!email) return [];
      const cleanEmail = email.toLowerCase().trim();
      return this.getAll().filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === cleanEmail);
    },

    createOrder(orderPayload) {
      const orders = this.getAll();
      const orderNumber = 'MJ-' + Math.floor(1086 + orders.length * 7 + Math.random() * 10);
      const trackingNumber = 'MJ-TRK-' + Math.floor(100000 + Math.random() * 900000);

      const newOrder = {
        id: orderNumber,
        customer: {
          name: orderPayload.customer.name,
          email: orderPayload.customer.email,
          phone: orderPayload.customer.phone,
          address: orderPayload.customer.address,
          city: orderPayload.customer.city,
          country: orderPayload.customer.country || 'United States',
          postalCode: orderPayload.customer.postalCode || ''
        },
        items: orderPayload.items || [],
        subtotal: parseFloat(orderPayload.subtotal) || 0,
        discount: parseFloat(orderPayload.discount) || 0,
        shipping: parseFloat(orderPayload.shipping) || 0,
        total: parseFloat(orderPayload.total) || 0,
        couponCode: orderPayload.couponCode || null,
        paymentMethod: orderPayload.paymentMethod || 'Cash on Delivery',
        paymentStatus: orderPayload.paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
        orderStatus: 'Pending',
        createdAt: new Date().toISOString(),
        trackingNumber: trackingNumber,
        carrier: 'Standard Luxury Courier'
      };

      orders.unshift(newOrder);
      window.MJStorage.set('orders', orders);

      // Deduct product inventory automatically
      if (window.MJProductStore && typeof window.MJProductStore.deductStockForOrder === 'function') {
        window.MJProductStore.deductStockForOrder(newOrder.items);
      }

      // Update customer record
      this._updateCustomerProfile(newOrder);

      // Send admin notification
      window.MJStorage.emit('admin:notification', {
        type: 'order',
        title: `New Order ${newOrder.id}`,
        message: `${newOrder.customer.name} placed an order for $${newOrder.total.toFixed(2)}`
      });

      return newOrder;
    },

    updateOrderStatus(orderId, newStatus) {
      const orders = this.getAll();
      const order = orders.find(o => o.id === orderId);
      if (!order) return null;

      order.orderStatus = newStatus;
      if (newStatus === 'Delivered') {
        order.paymentStatus = 'Paid';
      }
      window.MJStorage.set('orders', orders);

      window.MJStorage.emit('order:status_changed', { orderId, status: newStatus });
      return order;
    },

    updatePaymentStatus(orderId, newPaymentStatus) {
      const orders = this.getAll();
      const order = orders.find(o => o.id === orderId);
      if (!order) return null;

      order.paymentStatus = newPaymentStatus;
      window.MJStorage.set('orders', orders);
      return order;
    },

    _updateCustomerProfile(order) {
      const customers = window.MJStorage.get('customers') || [];
      const customerEmail = order.customer.email.toLowerCase().trim();
      let customer = customers.find(c => c.email.toLowerCase() === customerEmail);

      if (customer) {
        customer.totalOrders = (customer.totalOrders || 0) + 1;
        customer.totalSpent = (customer.totalSpent || 0) + order.total;
        customer.phone = order.customer.phone || customer.phone;
        customer.address = `${order.customer.address}, ${order.customer.city}`;
      } else {
        customer = {
          id: 'cust-' + Date.now(),
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone,
          totalOrders: 1,
          totalSpent: order.total,
          joinedDate: new Date().toISOString().split('T')[0],
          address: `${order.customer.address}, ${order.customer.city}`
        };
        customers.push(customer);

        window.MJStorage.emit('admin:notification', {
          type: 'customer',
          title: 'New Customer Registered',
          message: `${customer.name} placed their first order.`
        });
      }

      window.MJStorage.set('customers', customers);
    }
  };
})();
