var express = require("express");
var router = express.Router();
var Campground = require('../models/campground');
var middleware = require('../middleware');

//----------------------------------------------------CAMPGROUNDS
//INDEX - Display all campgrounds. 
router.get("/", function (req, res) {
    Campground.find({}, function (err, campgrounds) {
        if (err) {
            console.log(err)
        } else {
            res.render("campgrounds/index", { campgrounds: campgrounds, currentUser: req.user });
        }
    });
})

//NEW - Display form to create new campground
router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("campgrounds/new.ejs");
})


//CREATE - add new campground to database.
router.post("/", middleware.isLoggedIn, function (req, res) {
    var name = req.body.name;
    var description = req.body.description;
    var price = req.body.price;
    Campground.countDocuments({}, function (err, count) {
        var image = "https://picsum.photos/" + Math.floor(Math.random() * 1000) + "/" + Math.floor(Math.random() * 1000) + "?random=" + (count + 1);
        var newCampground = { name: name, image: image, description: description, author: { id: req.user._id, username: req.user.username }, price:price };
        Campground.create(newCampground, function (err2, campground) {
            if (err2) {
                req.flash("error", err.message);
            } else {
                req.flash("success", "Campground \"" + campground.name + "\" created successfully.");
                res.redirect("/campgrounds");
            }
        });
    })

})

//SHOW - Display details of one campground
router.get("/:id", function (req, res) {
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if (err || !foundCampground) {
            console.log(err);
            req.flash('error','Sorry, that campground does not exist!');
            res.redirect('/campgrounds');
        } else {
            res.render("campgrounds/show", { foundCampground: foundCampground });
        }
    })
})

//EDIT CAMPGROUND
router.get("/:id/edit", middleware.isLoggedIn, middleware.checkCampgroundOwnership, function (req, res) {
    res.render("campgrounds/edit", { campground: req.campground});
})

//UPDATE CAMPGROUND
router.put("/:id", middleware.isLoggedIn, middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function (err, campground) {
        if (err) throw err;
        req.flash("success", "Campground \"" + campground.name + "\" updated successfully.");
        res.redirect("/campgrounds/" + campground._id);
    })
})

//DESTROY CAMPGROUND
router.delete("/:id", middleware.isLoggedIn, middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findByIdAndDelete(req.params.id, function (err, campground) {
        if (err) throw err;
        req.flash("success", "Campground \"" + campground.name + "\" deleted successfully.");
        res.redirect("/campgrounds");
    })
})


module.exports = router;