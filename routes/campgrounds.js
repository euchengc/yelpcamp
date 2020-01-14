var express = require("express");
var router = express.Router();
var Campground = require('../models/campground');
var middleware = require('../middleware');


// IMAGE UPLOAD
var multer = require('multer');
var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter })

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'sudocode',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


//GEOCODER
var NodeGeocoder = require('node-geocoder');
var options = {
    provider: 'google',
    // Optional depending on the providers
    httpAdapter: 'https', // Default
    apiKey: process.env.GEOCODER_API_KEY, // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(options);

//----------------------------------------------------CAMPGROUNDS
//INDEX - Display all campgrounds. 
router.get("/", function (req, res) {
    var noMatch = null;
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
        Campground.find({ name: regex }, function (err, matchedCampgrounds) {
            if (err) {
                console.log(err);
            } else {
                if (matchedCampgrounds.length < 1) {
                    noMatch = "No campgrounds match that query, please try again.";
                }
                res.render("campgrounds/index", { campgrounds: matchedCampgrounds, noMatch: noMatch });
            }
        });
    } else {
        Campground.find({}, function (err, campgrounds) {
            if (err) {
                console.log(err)
            } else {
                res.render("campgrounds/index", { campgrounds: campgrounds, currentUser: req.user, noMatch: noMatch });
            }
        });
    }

})

//NEW - Display form to create new campground
router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("campgrounds/new.ejs");
})


//CREATE - add new campground to database.
router.post("/", middleware.isLoggedIn, upload.single('image'), function (req, res) {
    var name = req.body.campground.name;
    var description = req.body.campground.description;
    var price = req.body.campground.price;
    cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        // add cloudinary url for the image to the campground object under image property
        req.body.campground.image = result.secure_url;
        // add image's public_id to campground object
        req.body.campground.imageId = result.public_id;

        geocoder.geocode(req.body.campground.location, function (err, data) {
            if (err || !data.length) {
                console.log("um" + data);
                console.log(err);
                req.flash('error', 'Invalid address');
                return res.redirect('back');
            }
            var lat = data[0].latitude;
            var lng = data[0].longitude;
            var location = data[0].formattedAddress;
            Campground.countDocuments({}, function (err, count) {
                //var image = "https://picsum.photos/" + Math.floor(Math.random() * 1000) + "/" + Math.floor(Math.random() * 1000) + "?random=" + (count + 1);
                var newCampground = { name: name, image: req.body.campground.image, imageId: req.body.campground.imageId, description: description, author: { id: req.user._id, username: req.user.username }, price: price, location: location, lat: lat, lng: lng };
                Campground.create(newCampground, function (err, campground) {
                    if (err) {
                        req.flash("error", err.message);
                        return res.redirect('back');
                    } else {
                        req.flash("success", "Campground \"" + campground.name + "\" created successfully.");
                        res.redirect("/campgrounds");
                    }
                });
            })
        })
    })
})

//SHOW - Display details of one campground
router.get("/:id", function (req, res) {
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if (err || !foundCampground) {
            console.log(err);
            req.flash('error', 'Sorry, that campground does not exist!');
            res.redirect('/campgrounds');
        } else {
            res.render("campgrounds/show", { foundCampground: foundCampground });
        }
    })
})

//EDIT CAMPGROUND
router.get("/:id/edit", middleware.isLoggedIn, middleware.checkCampgroundOwnership, function (req, res) {
    res.render("campgrounds/edit", { campground: req.campground });
})

//UPDATE CAMPGROUND
router.put("/:id", middleware.isLoggedIn, middleware.checkCampgroundOwnership, upload.single('image'), function (req, res) {
    Campground.findById(req.params.id, async function (err, campground) {
        if (err) {
            req.flash('error', err.message);
            req.redirect('back');
        } else {
            geocoder.geocode(req.body.campground.location, function (err, data) {
                if (err || !data.length) {
                    req.flash('error', 'Invalid addrkess');
                    return res.redirect('back');
                }
                campground.lat = data[0].latitude;
                campground.lng = data[0].longitude;
                campground.location = data[0].formattedAddress;
            })
            if (req.file) {
                try {
                    await cloudinary.v2.uploader.destroy(campground.imageId);
                    var result = await cloudinary.v2.uploader.upload(req.file.path);
                    campground.imageId = result.public_id;
                    campground.image = result.secure_url;


                } catch (err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
            campground.price = req.body.campground.price;
            campground.name = req.body.campground.name;
            campground.description = req.body.campground.description;
            campground.save();
            req.flash("success", "Campground \"" + campground.name + "\" updated successfully.");
            res.redirect("/campgrounds/" + campground._id);
        }
    })
})

//DESTROY CAMPGROUND
router.delete("/:id", middleware.isLoggedIn, middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findByIdAndDelete(req.params.id, async function (err, campground) {
        if (err){
            req.flash('error',err.message);
            return res.redirect('back');
        }
        try{
            await cloudinary.v2.uploader.destroy(campground.imageId);
            req.flash("success", "Campground \"" + campground.name + "\" deleted successfully.");
        res.redirect("/campgrounds");

        }catch(err){
            if (err){
                req.flash('error',err.message);
                return res.redirect('back');
            }
        }
    });
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;