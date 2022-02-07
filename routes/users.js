const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/user');
const users = require('../controllers/users');
const { validateReview, isLoggedIn, isReviewAuthor, validateUser, isUserAdmin, isValidPassword, changePassword, deleteProfileImage, searchAndFilterUsers } = require('../middleware');

const { storage } = require('../cloudinary');
const multer = require('multer');
const upload = multer({ storage });

// Route to register user and register form
router.route('/register')
    .get(users.renderRegister)
    .post(upload.single('image'), catchAsync(users.register));

// Route to login and login form
router.route('/login')
    .get(users.renderLogin)
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.login)

// Route to logout
router.get('/logout', users.logout)

// Route to render user edit form
router.get('/users/:id/edit', isLoggedIn, catchAsync(users.renderEditForm))

// Routes for users profiles (CRUD)
router.route('/users/:id')
    .get(isLoggedIn, validateUser, catchAsync(users.showUser))
    .put(isLoggedIn, upload.single('image'), catchAsync(users.updateUser))
    .delete(isLoggedIn, validateUser, catchAsync(users.deleteUser))

// Route to show users list
router.get('/users', isLoggedIn, isUserAdmin, searchAndFilterUsers, catchAsync(users.index))

module.exports = router;