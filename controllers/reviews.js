const Place = require('../models/place');
const Review = require('../models/review');

// Controller to create a review
module.exports.createReview = async (req, res) => {
    const place = await Place.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    place.reviews.push(review);
    await review.save();
    await place.save();
    req.flash('success', 'Created new review!');
    res.redirect(`/places/${place._id}`);
}

// Controller to delete a review
module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    await Place.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review');
    res.redirect(`/places/${id}`);
}

// Controller to render edit review form
module.exports.renderEditForm = async (req, res) => {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
        req.flash('error', 'Cannot find that review!');
        return res.redirect('/places');
    }
    res.render('reviews/edit', { place_id: req.params.id, review: review });
}

// Controller to update review
module.exports.updateReview = async (req, res) => {
    const { id, reviewId } = req.params;
    const review = await Review.findByIdAndUpdate(reviewId, req.body.review);
    req.flash('success', 'Successfully updated review!');
    res.redirect(`/places/${id}`);
}


