const express = require('express');

const router = express.Router({ mergeParams: true });

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
// router.param('id', tourController.checkID);

// POST /tour/210301/reviews
// GET /tour/210301/reviews
// POST /reviews

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('admin', 'user'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo('admin', 'user'),
    reviewController.deleteReview,
  );

module.exports = router;
