var mongoose = require('mongoose');
const Comment = require('../models/comment');

var campgroundSchema = new mongoose.Schema({
    name: String,
    image: String,
    imageId: String,
    description: String,
    createdAt: {
        type:Date,
        default: Date.now
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    price: String,
    location:String,
    lat: Number,
    lng: Number
});

//find ids in campgrounds comments and go to comments table to delete them
campgroundSchema.pre('remove', async function(){
    await Comment.remove({
        _id : {
            $in: this.comments
        }
    })
})

module.exports = mongoose.model("Campground", campgroundSchema);
