const mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
  //username: {type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true},
  username: {
    type: String,
    unique: true,
    required: [true, "can't be blank"],
    index: true
  },
  email: {
    type: String,
    unique: true,
    required: [true, "can't be blank"],
    match: [/\S+@\S+\.\S+/, "is invalid"],
    index: true
  },
  bio: String,
  image: String,
  password: String,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

UserSchema.methods.toProfileJSONFor = function(user) {
  return {
    _id: this._id,
    username: this.username,
    bio: this.bio,
    image:
      this.image || "https://static.productionready.io/images/smiley-cyrus.jpg",
    following: user ? user.isFollowing(this._id) : false
  };
};

UserSchema.methods.follow = function(id) {
  if (this.following.indexOf(id) === -1) {
    this.following.push(id);
  }
  return this.save();
};

UserSchema.methods.unfollow = function(id) {
  this.following.remove(id);
  return this.save();
};

UserSchema.methods.isFollowing = function(id) {
  return this.following.some(function(followId) {
    return followId.toString() === id.toString();
  });
};

UserSchema.methods.favorite = function(id) {
  if (this.favorites.indexOf(id) === -1) {
    this.favorites.push(id);
  }
  return this.save();
};

UserSchema.methods.unfavorite = function(id) {
  this.favorites.remove(id);
  return this.save();
};

UserSchema.methods.isFavorite = function(id) {
  return this.favorites.some(function(favoriteId) {
    return favoriteId.toString() === id.toString();
  });
};

UserSchema.methods.toUserJSON = function() {
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    bio: this.bio,
    image: this.image,
    favorites: this.favorites,
    following: this.following
  };
};

mongoose.model("User", UserSchema);
