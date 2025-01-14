const express = require('express');
const app = express();
const path = require('path');

const {campgroundSchema, reviewSchema} = require('./schemas.js');
const mongoose = require('mongoose');

const methodOverride = require('method-override');
const ejsMATE = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');

const passport = require('passport');
const LocalStrategy = require('passport-local');

const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');


const Campground = require('./models/campground');
const Review = require('./models/review');
const User = require('./models/user');

const campgroundsRoutes = require('./routes/campgrounds');
const reviewsRoutes = require('./routes/reviews');
const usersRoutes = require('./routes/users');

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp',{
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useUnifiedTopology: true
})

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
    console.log("databace connected");
});

app.engine('ejs', ejsMATE)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public')))

const sessionConfig = {
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000*60 * 60 * 24 * 7,
        maxAge: 1000*60 * 60 * 24 * 7

    }
}
app.use(session(sessionConfig));
app.use(flash());

//we should use session before passport.session
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    
    res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
})

app.use('/campgrounds', campgroundsRoutes)
app.use('/campgrounds/:id/reviews', reviewsRoutes)
app.use('/',usersRoutes);

app.get('/', (req, res) => {
 res.render('home')  
})






app.all('*', (req, res, next) => {
next(new ExpressError('page not found', 404));
})

app.use((err, req, res, next) => {
    const {statusCode = 500} = err
    if(!err.message) err.message ='somthing gooing wrong!'
    res.status(statusCode).render('error',{err})

})

app.listen(3000, () => {
 console.log('listening on port 3000');   
})