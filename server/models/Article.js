const mongoose = require('mongoose');
const User = mongoose.model('User');

const ArticleSchema = new mongoose.Schema({
  title: String,
  description: String,
  body: String,
  favoritesCount: {type: Number, default: 0},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  tagList: [{ type: String }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

ArticleSchema.methods.toJSONFor = function(user){
  //console.log("TCL: ArticleSchema.methods.toJSONFor -> user", this.author)
  return {
    _id: this._id,
    title: this.title,
    description: this.description,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tagList: this.tagList,
    //favorited: user ? User.isFavorite(this._id) : false,
    favorited: false,
    favoritesCount: this.favoritesCount,
    author: this.author.toProfileJSONFor(user)
  };
};

mongoose.model('Article', ArticleSchema);