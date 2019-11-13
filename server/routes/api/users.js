const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");

// Preload user profile on routes with ':userid'
router.param("userid", function(req, res, next, userid) {
  User.findById(userid)
    .then(function(user) {
      if (!user) {
        return res.sendStatus(404);
      }
      req.profile = user;
      return next();
    })
    .catch(next);
});

// GET user profile
router.get("/", function(req, res, next) {
  if (req.query) {
    User.findById(req.query.profileId).then(function(user) {
      if (!user) {
        return res.json({ profile: req.query.toProfileJSONFor(false) });
      }
      return res.json(user);
    });
  } else {
    return res.json({ profile: req.query.toProfileJSONFor(false) });
  }
});

// Update profile info
router.put("/:userid", async (req, res, next) => {
  User.findById(req.body.user._id).then(function() {
    if (req.profile._id.toString() === req.req.body.user._id.toString()) {
      if (typeof req.body.user._id !== "undefined") {
        req.profile._id = req.body.user._id;
      }
      if (typeof req.body.user.email !== "undefined") {
        req.profile.email = req.body.user.email;
      }
      if (typeof req.body.user.email !== "undefined") {
        req.profile.username = req.body.user.username;
      }
      if (typeof req.body.user.bio !== "undefined") {
        req.profile.bio = req.body.user.bio;
      }
      if (typeof req.body.user.image !== "undefined") {
        req.profile.image = req.body.user.image;
      }
      req.profile
        .save()
        .then(function() {
          return res.json(req.user);
        })
        .catch(next);
    } else {
      return res.sendStatus(403);
    }
  });
});

// Follow user
router.post("/:userid/follow", function(req, res, next) {
  var profileId = req.profile._id;
  User.findById(req.body.id)
    .then(function(user) {
      if (!user) {
        return res.sendStatus(401);
      }
      return user.follow(profileId).then(function() {
        return res.json(user);
      });
    })
    .catch(next);
});

// Unfollow user
router.delete("/:userid/follow", function(req, res, next) {
  var profileId = req.profile._id;
  User.findById(req.query.id)
    .then(function(user) {
      if (!user) {
        return res.sendStatus(401);
      }
      return user.unfollow(profileId).then(function() {
        return res.json(user);
      });
    })
    .catch(next);
});

module.exports = router;
