const Place = require('../models/place');
const User = require('../models/user');
const { cloudinary } = require("../cloudinary");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
// const mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');


// Controller for list of posts
module.exports.index = async (req, res, next) => {
    const { dbQuery } = res.locals;
    delete res.locals.dbQuery;
    const places = await Place.paginate(dbQuery, {
        page: req.query.page || 1,
        limit: 10
    });
    places.page = Number(places.page);
    res.render('places/index', { places });
    function escapeRegex(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };
}

// Controller to render new post form
module.exports.renderNewForm = (req, res) => {
    res.render('places/new');
}

//Controller to create a post
module.exports.createPlace = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.place.city,
        limit: 1
    }).send()
    const place = new Place(req.body.place);
    place.geometry = geoData.body.features[0].geometry;
    place.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    place.author = req.user._id;
    await place.save();
    console.log(place);
    req.flash('success', 'Successfully posted a new place!');
    res.redirect(`/places/${place._id}`)
}

// Controller to show a post
module.exports.showPlace = async (req, res,) => {
    const place = await Place.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!place) {
        req.flash('error', 'Cannot find that place!');
        return res.redirect('/places');
    }
    const floorRating = place.calculateAvgRating();
    res.render('places/show', { place, floorRating });
}

// Controller to render post edit form
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const place = await Place.findById(id)
    if (!place) {
        req.flash('error', 'Cannot find that place!');
        return res.redirect('/places');
    }
    res.render('places/edit', { place });
}

// Controller to update post
module.exports.updatePlace = async (req, res) => {
    const { id } = req.params;
    const place = await Place.findByIdAndUpdate(id, { ...req.body.place });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    place.images.push(...imgs);
    await place.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await place.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Successfully updated the place!');
    res.redirect(`/places/${place._id}`)
}

// Controller to delete post
module.exports.deletePlace = async (req, res) => {
    const { id } = req.params;
    await Place.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted place')
    res.redirect('/places');
}

// Controller for about page
module.exports.about = (req, res) => {
    res.render('places/about')
}