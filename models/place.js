const mongoose = require('mongoose');
const Review = require('./review')
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;


// Schema for the images
const ImageSchema = new Schema({
    url: String,
    filename: String
});

// User clean Cloudinary of not used images
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

const opts = { toJSON: { virtuals: true } };

const PlaceSchema = new Schema({
    title: String,
    images: [ImageSchema],
    price: Number,
    description: String,
    services: String,
    street: String,
    doorNumber: Number,
    zipCode: String,
    city: String,
    country: String,
    phone: Number,
    email: String,
    tag: String,
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    createdAt: { type: Date, default: Date.now },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    avgRating: { type: Number, default: 0 }
});


PlaceSchema.virtual('properties.popUpMarkup').get(function () {
    return `
    <strong><a href="/places/${this._id}">${this.title}</a><strong>
    <p>${this.description.substring(0, 20)}...</p>`
});


// Setup for when deleting place, delete it's reviews
PlaceSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
});

// Method for average rating
PlaceSchema.methods.calculateAvgRating = function () {
    let ratingsTotal = 0;
    if (this.reviews.length) {
        this.reviews.forEach(review => {
            ratingsTotal += review.rating;
        });
        this.avgRating = Math.round((ratingsTotal / this.reviews.length) * 10) / 10;
    } else {
        this.avgRating = ratingsTotal;
    }
    const floorRating = Math.floor(this.avgRating);
    this.save();
    return floorRating;
}

// Allow pagination in posts
PlaceSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Place', PlaceSchema);