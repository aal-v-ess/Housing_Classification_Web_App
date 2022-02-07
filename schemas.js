const BaseJoi = require('joi');
const { number } = require('joi');
const sanitizeHtml = require('sanitize-html');

// Sanitize form inputs for security
const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension);



module.exports.placeSchema = Joi.object({
    place: Joi.object({
        title: Joi.string().required().escapeHTML(),
        price: Joi.number().required().min(0),
        street: Joi.string().required().escapeHTML(),
        doorNumber: Joi.number().min(0),
        zipCode: Joi.string().required().escapeHTML(),
        tag: Joi.string().required().escapeHTML(),
        city: Joi.string().required().escapeHTML(),
        country: Joi.string().required().escapeHTML(),
        phone: Joi.number().min(0),
        email: Joi.string().required().escapeHTML(),
        //image: Joi.string().required(),
        description: Joi.string().required().max(500).escapeHTML(),
        services: Joi.string().required().max(500).escapeHTML()
    }).required(),
    deleteImages: Joi.array()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        body: Joi.string().required().escapeHTML(),
    }).required()
});

/*
module.exports.userSchema = Joi.object({
    // user: Joi.object({
    //username: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    bio: Joi.string().required(),
    street: Joi.string().required(),
    doorNumber: Joi.number().required(),
    zipCode: Joi.string().required(),
    city: Joi.string().required(),
    country: Joi.string().required(),
    email: Joi.string().required(),
    phone: Joi.number().required()
    //}).required()
})*/


