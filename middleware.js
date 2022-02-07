const { placeSchema, reviewSchema, userSchema } = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const Place = require('./models/place');
const User = require('./models/user');
const Review = require('./models/review');
const { cloudinary } = require('./cloudinary');



// Middleware to check if user is logged in
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

// Middleware to validate post body
module.exports.validatePlace = (req, res, next) => {
    const { error } = placeSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

// Middleware to check if user exists
module.exports.validateUser = async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (user) {
        next();
    } else {
        req.flash('error', 'User does not exist!');
        return res.redirect(`/places`);
    }
}

// Middleware to check is current user is the post author
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const place = await Place.findById(id);
    if (place.author.equals(req.user._id) || req.user.isAdmin) {
        next();
    }
    else if (!place.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/places/${id}`);
    }
}

// Middleware to check is current user is the review author
module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    console.log(req.params);
    console.log(req.user._id);
    const review = await Review.findById(reviewId);
    //eval(require('locus'));
    if (review.author.equals(req.user._id) || req.user.isAdmin) {
        next();
    } else if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/places/${id}`);
    }


}

// Middleware to validate review body
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

// Middleware to check if user is admin
module.exports.isUserAdmin = (req, res, next) => {
    if (req.user.isAdmin) {
        next();
    } else {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/places`);
    }
}


module.exports.authUser = (req, res, next) => {
    const user = User.findById()
    if (user.user_id.equals(req.user._id)) {
        next();
    } else {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/places`);
    }
}


//Middleware for search and filter posts
module.exports.searchAndFilterPosts = async (req, res, next) => {
    // create array from pulled keys from query
    const queryKeys = Object.keys(req.query);
    if (queryKeys.length) {
        // initialize an empty array to store db queries in
        const dbQueries = [];
        let { search, price, avgRating } = req.query;
        if (search) {
            search = new RegExp(escapeRegex(search), 'gi');
            dbQueries.push({
                $or: [
                    { title: search, },
                    { "description": search },
                    { "city": search },
                    { "country": search },
                    { "street": search },
                    { "zipCode": search },
                    { "tag": search }
                ]
            });
        }

        if (price) {
            if (price.min) dbQueries.push({ price: { $gte: price.min } });
            if (price.max) dbQueries.push({ price: { $lte: price.max } });
        }

        if (avgRating) {
            dbQueries.push({ avgRating: { $in: avgRating } });
        }
        // pass database query to next middleware in route's middleware chain
        res.locals.dbQuery = dbQueries.length ? { $and: dbQueries } : {};
    }
    // pass req.query to the view as a local variable to be used in the partial
    res.locals.query = req.query;
    // build the paginateUrl for paginatePosts partial
    queryKeys.splice(queryKeys.indexOf('page'), 1);
    // delimite search query so page is in the end of the url
    const delimiter = queryKeys.length ? '&' : '?';
    // build the paginateUrl local variable to be used in the partial
    res.locals.paginateUrl = req.originalUrl.replace(/(\?|\&)page=\d+/g, '') + `${delimiter}page=`;
    next();
}

// Middleware for search and filter users
module.exports.searchAndFilterUsers = async (req, res, next) => {
    const queryKeys = Object.keys(req.query);
    if (queryKeys.length) {
        const dbQueries = [];
        let { search } = req.query;
        if (search) {
            search = new RegExp(escapeRegex(search), 'gi');
            dbQueries.push({
                $or: [
                    { username: search, },
                    { firstName: search },
                    { lastName: search },
                    { bio: search }
                ]
            });
        }
        res.locals.dbQuery = dbQueries.length ? { $and: dbQueries } : {};
    }
    res.locals.query = req.query;
    queryKeys.splice(queryKeys.indexOf('page'), 1);
    const delimiter = queryKeys.length ? '&' : '?';
    res.locals.paginateUrl = req.originalUrl.replace(/(\?|\&)page=\d+/g, '') + `${delimiter}page=`;
    next();
}


// Escape regular expressions function
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};