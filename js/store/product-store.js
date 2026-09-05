// Product and Category Store Module
(function() {
  window.MJProductStore = {
    getAll() {
      return window.MJStorage.get('products') || [];
    },

    getById(id) {
      return this.getAll().find(p => p.id === id) || null;
    },

    getBySlug(slug) {
      return this.getAll().find(p => p.slug === slug) || null;
    },

    getFeatured() {
      return this.getAll().filter(p => p.isFeatured);
    },

    getBestSellers() {
      return this.getAll().filter(p => p.isBestSeller);
    },

    getNewArrivals() {
      return this.getAll().filter(p => p.isNew);
    },

    getByCategory(categoryName) {
      return this.getAll().filter(p => p.category.toLowerCase() === categoryName.toLowerCase());
    },

    getCategories() {
      return window.MJStorage.get('categories') || [];
    },

    getCategoryById(id) {
      return this.getCategories().find(c => c.id === id) || null;
    },

    // Multi-faceted filtering & search engine
    filterProducts(options = {}) {
      let list = this.getAll();

      // Search query filter (matches name, description, category, subcategory, material)
      if (options.search && options.search.trim() !== '') {
        const q = options.search.toLowerCase().trim();
        list = list.filter(p => 
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
          (p.material && p.material.toLowerCase().includes(q))
        );
      }

      // Category filter
      if (options.category && options.category !== 'all') {
        list = list.filter(p => p.category.toLowerCase() === options.category.toLowerCase());
      }

      // Subcategory filter
      if (options.subcategory && options.subcategory !== 'all') {
        list = list.filter(p => p.subcategory && p.subcategory.toLowerCase() === options.subcategory.toLowerCase());
      }

      // Price range
      if (typeof options.minPrice === 'number') {
        list = list.filter(p => (p.salePrice || p.price) >= options.minPrice);
      }
      if (typeof options.maxPrice === 'number') {
        list = list.filter(p => (p.salePrice || p.price) <= options.maxPrice);
      }

      // In stock only
      if (options.inStockOnly) {
        list = list.filter(p => p.stock > 0);
      }

      // Sorting
      if (options.sortBy) {
        switch (options.sortBy) {
          case 'price-asc':
            list.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
            break;
          case 'price-desc':
            list.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
            break;
          case 'newest':
            list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
            break;
          case 'rating':
            list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
          case 'bestselling':
          default:
            list.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
            break;
        }
      }

      return list;
    },

    // Admin CRUD Operations
    addProduct(productData) {
      const products = this.getAll();
      const newProduct = {
        id: 'prod-' + Date.now(),
        sku: productData.sku || 'MJ-SKU-' + Math.floor(1000 + Math.random() * 9000),
        name: productData.name,
        slug: productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        category: productData.category,
        subcategory: productData.subcategory || '',
        price: parseFloat(productData.price) || 0,
        salePrice: productData.salePrice ? parseFloat(productData.salePrice) : null,
        stock: parseInt(productData.stock) || 0,
        isFeatured: !!productData.isFeatured,
        isBestSeller: !!productData.isBestSeller,
        isNew: !!productData.isNew,
        rating: 5.0,
        reviewCount: 0,
        material: productData.material || 'Premium Fabric',
        sizes: productData.sizes || ['Standard'],
        colors: productData.colors || [{ name: 'Default', hex: '#D99AA8' }],
        images: productData.images && productData.images.length ? productData.images : ['assets/images/fashion-dress.jpg'],
        description: productData.description || '',
        specs: productData.specs || ['High Quality Finish', 'Designed for comfort and longevity']
      };

      products.unshift(newProduct);
      window.MJStorage.set('products', products);

      // Trigger admin notification
      window.MJStorage.emit('admin:notification', {
        type: 'product',
        title: 'New Product Added',
        message: `${newProduct.name} has been published.`
      });

      return newProduct;
    },

    updateProduct(id, updatedFields) {
      const products = this.getAll();
      const index = products.findIndex(p => p.id === id);
      if (index === -1) return null;

      if (updatedFields.name && (!updatedFields.slug || updatedFields.name !== products[index].name)) {
        updatedFields.slug = updatedFields.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      products[index] = { ...products[index], ...updatedFields };
      window.MJStorage.set('products', products);
      return products[index];
    },

    deleteProduct(id) {
      let products = this.getAll();
      products = products.filter(p => p.id !== id);
      window.MJStorage.set('products', products);
    },

    adjustStock(id, delta) {
      const products = this.getAll();
      const product = products.find(p => p.id === id);
      if (!product) return null;

      product.stock = Math.max(0, (product.stock || 0) + delta);
      window.MJStorage.set('products', products);

      // Low stock check
      if (product.stock <= 5 && product.stock > 0) {
        window.MJStorage.emit('admin:notification', {
          type: 'stock',
          title: 'Low Stock Alert',
          message: `${product.name} is running low (${product.stock} left).`
        });
      }

      return product;
    },

    deductStockForOrder(items) {
      const products = this.getAll();
      items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          prod.stock = Math.max(0, (prod.stock || 0) - (item.quantity || 1));
          if (prod.stock <= 5) {
            window.MJStorage.emit('admin:notification', {
              type: 'stock',
              title: 'Low Stock Warning',
              message: `${prod.name} has only ${prod.stock} units remaining.`
            });
          }
        }
      });
      window.MJStorage.set('products', products);
    },

    // Category CRUD
    addCategory(catData) {
      const categories = this.getCategories();
      const newCat = {
        id: 'cat-' + Date.now(),
        name: catData.name,
        slug: catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: catData.description || '',
        image: catData.image || 'assets/images/fashion-dress.jpg',
        subcategories: catData.subcategories || []
      };
      categories.push(newCat);
      window.MJStorage.set('categories', categories);
      return newCat;
    },

    updateCategory(id, data) {
      const categories = this.getCategories();
      const idx = categories.findIndex(c => c.id === id);
      if (idx === -1) return null;
      categories[idx] = { ...categories[idx], ...data };
      window.MJStorage.set('categories', categories);
      return categories[idx];
    },

    deleteCategory(id) {
      let categories = this.getCategories();
      categories = categories.filter(c => c.id !== id);
      window.MJStorage.set('categories', categories);
    }
  };
})();
