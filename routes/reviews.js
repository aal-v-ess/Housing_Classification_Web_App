const express = require('express');
const router = express.Router({ mergeParams: true });
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware');
const multer = require('multer');
const Place = require('../models/place');
const Review = require('../models/review');
const reviews = require('../controllers/reviews');
const ExpressError = require('../utils/ExpressError');
const catchAsync = require('../utils/catchAsync');

// Route to create a review 
router.post('/', isLoggedIn, validateReview, catchAsync(reviews.createReview))

// Route to render edit review form
router.get('/:reviewId/edit', isLoggedIn, isReviewAuthor, catchAsync(reviews.renderEditForm))

router.put('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviews.updateReview))

router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview))


// Route to update and delete a review
/* router.route('/:reviewId')
    .put(isLoggedIn, isReviewAuthor, catchAsync(reviews.updateReview))
    .delete(isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview))
 */

module.exports = router;