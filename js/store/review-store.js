// Customer Reviews Store Module
(function() {
  window.MJReviewStore = {
    getAll() {
      return window.MJStorage.get('reviews') || [];
    },

    getApproved() {
      return this.getAll().filter(r => r.status === 'approved');
    },

    getByProductId(productId) {
      return this.getApproved().filter(r => r.productId === productId);
    },

    addReview(reviewData) {
      const reviews = this.getAll();
      const newReview = {
        id: 'rev-' + Date.now(),
        productId: reviewData.productId,
        productName: reviewData.productName,
        customerName: reviewData.customerName || 'Anonymous Shopper',
        rating: parseInt(reviewData.rating) || 5,
        comment: reviewData.comment || '',
        date: new Date().toISOString().split('T')[0],
        status: reviewData.status || 'pending', // Requires Admin Approval
        verified: true
      };

      reviews.unshift(newReview);
      window.MJStorage.set('reviews', reviews);

      // Only update metrics if it is approved
      if (newReview.status === 'approved') {
        this._updateProductRatingMetrics(newReview.productId);
      }

      // Admin notification event
      window.MJStorage.emit('admin:notification', {
        type: 'review',
        title: 'New Review Pending Approval',
        message: `${newReview.customerName} submitted a ${newReview.rating}★ review for "${newReview.productName}". Needs Admin Approval.`
      });

      return newReview;
    },

    updateReviewStatus(id, newStatus) {
      const reviews = this.getAll();
      const rev = reviews.find(r => r.id === id);
      if (!rev) return null;

      rev.status = newStatus;
      window.MJStorage.set('reviews', reviews);
      this._updateProductRatingMetrics(rev.productId);
      return rev;
    },

    deleteReview(id) {
      let reviews = this.getAll();
      const rev = reviews.find(r => r.id === id);
      const prodId = rev ? rev.productId : null;

      reviews = reviews.filter(r => r.id !== id);
      window.MJStorage.set('reviews', reviews);

      if (prodId) {
        this._updateProductRatingMetrics(prodId);
      }
    },

    _updateProductRatingMetrics(productId) {
      if (!productId || !window.MJProductStore) return;
      const productReviews = this.getByProductId(productId);
      if (productReviews.length === 0) return;

      const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
      window.MJProductStore.updateProduct(productId, {
        rating: parseFloat(avg.toFixed(1)),
        reviewCount: productReviews.length
      });
    }
  };
})();
