// Setup dotenv
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}


const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const userRoutes = require('./routes/users');
const placeRoutes = require('./routes/places');
const reviewRoutes = require('./routes/reviews');
const { contentSecurityPolicy } = require('helmet');


// Connection to database
mongoose.connect('mongodb://localhost:27017/FlyBnB', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

// Database connection error verification
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected to FlyBnB");
});

// Setup Express
const app = express();

// Setup EJS
app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

// Setup moment for dates
app.locals.moment = require('moment');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

// Define Express session variables
const sessionConfig = {
    //name: 'notSessionID',   // Changes session ID cookie name
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}


app.use(session(sessionConfig))
app.use(flash());
//app.use(helmet({ contentSecurityPolicy: false }));

// Setup passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    //console.log(req.session)
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

// Setup Routes
app.use('/', userRoutes);
app.use('/places', placeRoutes)
app.use('/places/:id/reviews', reviewRoutes)

// Home Page Route
app.get('/', (req, res) => {
    res.render('home')
});

// Catch all errors for error template
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

// Render errors
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

// Start server
app.listen(3000, () => {
    console.log('Serving on port 3000')
})


