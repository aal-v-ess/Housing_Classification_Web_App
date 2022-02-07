const User = require('../models/user');
const Place = require('../models/place');
const Review = require('../models/review');
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
const { campgroundSchema } = require('../schemas');
const util = require('util');
const { cloudinary } = require('../cloudinary');
const { deleteProfileImage } = require('../middleware');


// Controller to render register page
module.exports.renderRegister = (req, res, next) => {
    res.render('users/register');
}

// Controller to register user
module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password, adminCode, bio, firstName, lastName, street, doorNumber, zipCode, city, country, phone } = req.body;
        const user = new User({ email, username, bio, firstName, lastName, phone, street, doorNumber, zipCode, city, country });
        if (req.file) {
            user.images.secure_url = req.file.path;
            user.images.filename = req.file.filename;
        }
        if (adminCode === process.env.ADMIN_CODE) {
            user.isAdmin = true;
        }
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to FlyBnB ' + username + '!');
            res.redirect('/users/' + user._id);
        })
    } catch (e) {
        // Delete uploaded image from cloud if error occurs
        if (req.file) await cloudinary.uploader.destroy(req.file.filename);
        req.flash('error', e.message);
        res.redirect('register');
    }
}

// Controller to render login page
module.exports.renderLogin = (req, res, next) => {
    res.render('users/login');
}

// Controller to login user
module.exports.login = (req, res, next) => {
    req.flash('success', 'Welcome back!');
    const redirectUrl = req.session.returnTo || '/places';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

// Controller to logout user
module.exports.logout = (req, res, next) => {
    req.logout();
    req.flash('success', "Goodbye!");
    res.redirect('/places');
}

// Controller to show user profile
module.exports.showUser = async (req, res, next) => {
    User.findById(req.params.id, function (err, foundUser) {
        if (err) {
            req.flash('error', 'User not found!');
            return res.redirect('/');
        }
        Place.find().where('author').equals(foundUser._id).exec(function (err, places) {
            if (err) {
                req.flash("error", "Something went wrong, try again in a few moments");
                return res.redirect("/");
            }
            res.render("users/show", { user: foundUser, places: places });
        })
    })
}

// Controller to render edit user profile
module.exports.renderEditForm = async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        req.flash('error', 'Cannot find that user!');
        return res.redirect('/places');
    }
    res.render('users/edit', { user });
}

// Controller to update user
module.exports.updateUser = async (req, res, next) => {
    const { username, email, bio, firstName, lastName, street, doorNumber, zipCode, city, country, phone, adminCode } = req.body;
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { email, bio, firstName, lastName, phone, street, doorNumber, zipCode, city, country });
    if (adminCode === process.env.ADMIN_CODE) {
        user.isAdmin = true;
    }
    if (req.file) {
        if (user.images.filename) await cloudinary.uploader.destroy(user.images.filename);
        user.images.secure_url = req.file.path;
        user.images.filename = req.file.filename;
    }
    await user.save();
    req.flash('success', 'Successfully updated user profile');
    res.redirect(`/users/${user._id}`);
}

// Controller to delete user profile
module.exports.deleteUser = async (req, res, next) => {
    const { id } = req.params;
    await User.findOneAndDelete({ _id: id });
    req.flash('success', 'Successfully deleted user profile');
    res.redirect(`/places`);
}

// Controller to show list of users
module.exports.index = async (req, res, next) => {
    const { dbQuery } = res.locals;
    delete res.locals.dbQuery;
    const users = await User.paginate(dbQuery, {
        page: req.query.page || 1,
        limit: 2
    });
    users.page = Number(users.page);
    res.render('users/index', { users });
}


