var express = require("express");
var router = express.Router();
var User = require('../models/user');
var Campground = require('../models/campground');

router.get("/:id", function(req,res){
    User.findById(req.params.id,function(err, user){
        if(err){
            console.log(err)
            req.flash("error", "Something went wrong.");
            res.redirect("/");
        }
        Campground.find().where('author.id').equals(user._id).exec(function(err,campgrounds){
            if(err){
                console.log(err)
                req.flash("error", "Something went wrong.");
                res.redirect("/");
            }
            res.render("users/show",{user:user, campgrounds:campgrounds});
        })
        
    });
});



module.exports = router;