const mongoose = require("mongoose");
const User = mongoose.model("User");

const ArticleSchema = new mongoose.Schema({
  title: String,
  description: String,
  body: String,
  favoritesCount: { type: Number, default: 0 },
  createdAt: Date,
  updatedAt: Date,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  tagList: [{ type: String }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

ArticleSchema.methods.updateFavoriteCount = function() {
  let article = this;

  return User.count({ favorites: { $in: [article._id] } }).then(function(
    count
  ) {
    article.favoritesCount = count;
    return article.save();
  });
};

ArticleSchema.methods.toJSONFor = function(user) {
  return {
    _id: this._id,
    title: this.title,
    description: this.description,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tagList: this.tagList,
    favorited: user ? user.isFavorite(this._id) : false,
    favoritesCount: this.favoritesCount,
    author: this.author.toProfileJSONFor(user)
  };
};

mongoose.model("Article", ArticleSchema);
