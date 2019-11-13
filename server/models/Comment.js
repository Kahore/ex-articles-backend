var mongoose = require("mongoose");

var CommentSchema = new mongoose.Schema({
  body: String,
  createdAt: Date,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  article: { type: mongoose.Schema.Types.ObjectId, ref: "Article" }
});

// Requires population of author
CommentSchema.methods.toJSONFor = function(user) {
  return {
    _id: this._id,
    body: this.body,
    createdAt: this.createdAt,
    author: this.author.toProfileJSONFor(user)
  };
};

mongoose.model("Comment", CommentSchema);
