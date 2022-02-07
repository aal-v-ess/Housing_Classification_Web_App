const { nextTick } = require('async');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const Place = require('./place');
const Review = require('./review');
const mongoosePaginate = require('mongoose-paginate');


const UserSchema = new Schema({
    username: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    bio: { type: String, required: true },
    street: { type: String, required: true },
    doorNumber: { type: Number, required: true },
    zipCode: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: Number, required: true },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    images: {
        secure_url: { type: String, default: '/images/default-profile.jpg' },
        filename: String
    },
    places: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Place'
        }
    ],
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
});

// Setup for when deleting a user, delete it's posts and reviews
UserSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        //console.log(doc)
        await Place.deleteMany({ author: { $eq: doc._id } });
        await Review.deleteMany({ author: { $eq: doc._id } });
    }
})

// Allow passport authentication
UserSchema.plugin(passportLocalMongoose);

// Allow pagination in users
UserSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('User', UserSchema);

