//-------------------------------------------------COMMENTS----------------------------------
var express = require('express');
var router = express.Router({mergeParams:true});
var Campground = require('../models/campground')
var Comment = require('../models/comment');
var middleware = require('../middleware');

//COMMENTS NEW
router.get("/new", isLoggedIn, function(req,res){
    Campground.findById(req.params.id, function(err,campground){
        if (err) throw err;
        res.render("comments/new", {campground: campground});
    })
})

//COMMENTS CREATE
router.post("/", isLoggedIn, function(req,res){
    var newComment = {text:req.body.comment.text, author:{id:req.user._id, username:req.user.username}};
    Comment.create(newComment,function(err,comment){
        if (err) throw err;
        Campground.findById(req.params.id,function(err,campground){
            campground.comments.push(comment);
            campground.save();
            req.flash("success", "Comment created successfully.");
            res.redirect("/campgrounds/" + campground._id);
        })
    })
})

//COMMENTS EDIT
router.get("/:comments_id/edit",middleware.isLoggedIn,middleware.checkCommentOwnership,function(req,res){
    res.render("comments/edit",{campground_id:req.params.id,comment:req.comment});
})

//COMMENTS UPDATE
router.put("/:comments_id",middleware.isLoggedIn,middleware.checkCommentOwnership,function(req,res){
    Comment.findByIdAndUpdate(req.params.comments_id,req.body.comment,function(err){
        if(err) throw err;
        req.flash("success", "Comment updated successfully.");
        res.redirect("/campgrounds/" + req.params.id);
    })
})

//COMMENTS DESTROY
router.delete("/:comments_id", middleware.isLoggedIn,middleware.checkCommentOwnership, function(req,res){
    Comment.findByIdAndDelete(req.params.comments_id,function(err){
        if(err) throw err;
        req.flash("success", "Comment deleted successfully.");
        res.redirect("/campgrounds/" + req.params.id);
    })
})

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that!");
    res.redirect('/login');
}

module.exports = router;