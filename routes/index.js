var express = require('express');
var router = express.Router();
var User = require('../models/user');
var passport = require('passport');

router.get("/", function (req, res) {
    res.render("home");
});

//AUTH ROUTESM

//show register form
router.get('/register', function (req, res) {
    res.render("register");
})

router.post('/register', function (req, res) {
    var newUser = new User({ username: req.body.username });
    User.register(newUser, req.body.password, function (err) {
        if (err) {
            console.log(err);
            req.flash("error", err.message);
            res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "You have logged in successfully.");
            res.redirect("/campgrounds");
        })
    })
})

router.get("/login", function (req, res) {
    res.render("login");
})

router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}))

router.get("/logout", function (req, res) {
    req.flash("success", "You have logged out successfully.");
    req.logout();
    res.redirect("/campgrounds");
})

module.exports = router;