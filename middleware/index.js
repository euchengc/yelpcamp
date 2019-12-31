var middlewareObj = {};
var Campground = require('../models/campground');
var Comment = require('../models/comment');


middlewareObj.checkCampgroundOwnership = function (req, res, next) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) throw err;
        if (!campground) {
            req.flash('error','Sorry, that campground does not exist!');
            res.redirect('/campgrounds');
            //return res.status(400).send("Item not found.");
        }else if (campground.author.id.equals(req.user._id)) {
            req.campground = campground;
            next();
        }else {
            req.flash("error", "You don't have permission to do that!");
            res.redirect("back");
        }
    })
}

middlewareObj.checkCommentOwnership = function (req, res, next) {
    Comment.findById(req.params.comment_id, function (err, comment) {
        if (err) throw err;
        if (!comment) {
            //return res.status(400).send("Item not found.");
            req.flash('error','Sorry, that comment does not exist!');
            res.redirect('/campgrounds');
        }
        else if (comment.author.id.equals(req.user._id)) {
            req.comment = comment;
            next();
        } else {
            req.flash("error", "You don't have permission to do that!");
            res.redirect("back");
        }
    })
}

middlewareObj.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that.");
    res.redirect('/login');
}

module.exports = middlewareObj;