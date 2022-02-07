const express = require('express');
const router = express.Router();
const places = require('../controllers/places');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validatePlace, searchAndFilterPosts } = require('../middleware');
const { storage } = require('../cloudinary');
const multer = require('multer');
const upload = multer({ storage });

const Place = require('../models/place');

// Route to create post and show posts list
router.route('/')
    .get(searchAndFilterPosts, catchAsync(places.index))
    .post(isLoggedIn, upload.array('image'), validatePlace, catchAsync(places.createPlace))

// Route to render scope page
router.get('/about', places.about)

// Route to render new post form
router.get('/new', isLoggedIn, places.renderNewForm)

// Routes to show post, update post and delete post
router.route('/:id')
    .get(catchAsync(places.showPlace))
    .put(isLoggedIn, isAuthor, upload.array('image'), validatePlace, catchAsync(places.updatePlace))
    .delete(isLoggedIn, isAuthor, catchAsync(places.deletePlace));

// Route to render edit post form
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(places.renderEditForm))




module.exports = router;
