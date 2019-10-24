const mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  username: {type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true},
  email: {type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true},
  bio: String,
  image: String,
  password: String,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

UserSchema.methods.toProfileJSONFor = function(user){
  return {
    _id: this._id,
    username: this.username,
    bio: this.bio,
    image: this.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
    //following: user ? user.isFollowing(this._id) : false
    following: false
  };
};

UserSchema.methods.isFavorite = function(id){
  return this.favorites.some(function(favoriteId){
    return favoriteId.toString() === id.toString();
  });
};

UserSchema.methods.toUserJSON = function(){
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    token: this.generateJWT(),
    bio: this.bio,
    image: this.image
  };
};

mongoose.model('User', UserSchema);