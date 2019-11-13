const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = mongoose.model("User");

router.get("/", function(req, res, next) {
  let param = JSON.parse(req.query.user);
  User.findOne({ email: param.email, password: param.password })
    .then(function(user) {
      if (!user) {
        return res.sendStatus(401);
      }
      return res.json(user);
    })
    .catch(next);
});

router.post("/", async (req, res, next) => {
  User.findOne({ email: req.body.user.email, password: req.body.user.password })
    .then(function(user) {
      if (user) {
        return res.sendStatus(409);
      }
      let data = {
        email: req.body.user.email,
        username: req.body.user.username,
        password: req.body.user.password,
        bio: "",
        image: "",
        favorites: [],
        following: []
      };
      let userInfo = new User(data);
      return userInfo.save().then(function() {
        return res.json(userInfo);
      });
    })
    .catch(next);
});

module.exports = router;
