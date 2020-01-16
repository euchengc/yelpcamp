//IMPORTS
require('dotenv').config();
var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require('passport');
var localStrategy = require('passport-local');
var methodOverride = require('method-override');
var flash = require('connect-flash');
app.locals.moment = require('moment');

//MONGODB SETUP
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex',true);
//mongoose.connect("mongodb://localhost/yelpcamp");
mongoose.connect(process.env.MONGODB_URL || "mongodb://localhost/yelpcamp", {
    useNewUrlParser:true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(()=> {
    console.log('Connected to DB!');
}).catch(err=>{
    console.log('ERROR:', err.message)
})

var seedDB = require('./seedDB');
//seedDB();


//DATA MODELS
var User = require('./models/user');

//EXPRESS SETUP
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(flash());

// app.listen(3000, function () {
//     console.log("Server started at port 3000.");
// })
app.listen(3000,process.env.IP, function(){
    console.log("The Yelpcamp server has started on port 3000!");
})

//AUTHENTICATION SETUP (PASSPORT)
app.use(require('express-session')({
    secret: "I love pizza!",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
})

//ROUTES
var commentRoutes = require("./routes/comments");
var campgroundRoutes = require('./routes/campgrounds');
var indexRoutes = require('./routes/index');
var userRoutes = require('./routes/users');

app.use(indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments",commentRoutes);
app.use("/users",userRoutes);