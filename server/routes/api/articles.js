const express = require("express");
const mongoose = require("mongoose");
var ObjectId = require("mongodb").ObjectId;

const router = express.Router();
const User = mongoose.model("User");
const Article = mongoose.model("Article");
const Comment = mongoose.model("Comment");

// Preload article objects on routes with ':article'
router.param("article", function(req, res, next, articleId) {
  Article.findOne({ _id: new ObjectId(articleId) })
    .populate("author")
    .then(function(article) {
      if (!article) {
        return res.sendStatus(404);
      }

      req.article = article;

      return next();
    })
    .catch(next);
});

router.param("comment", function(req, res, next, id) {
  Comment.findById(id)
    .then(function(comment) {
      if (!comment) {
        return res.sendStatus(404);
      }

      req.comment = comment;

      return next();
    })
    .catch(next);
});

// GET
router.get("/", function(req, res, next) {
  var query = {};
  var limit = 20;
  var offset = 0;

  if (typeof req.query.limit !== "undefined") {
    limit = req.query.limit;
  }

  if (typeof req.query.offset !== "undefined") {
    offset = req.query.offset;
  }

  let filter = "";
  if (typeof req.query.filter !== "undefined") {
    filter = JSON.parse(req.query.filter);
    if (typeof filter._id !== "undefined") {
      query._id = { _id: new ObjectId(filter._id) };
    }
    if (typeof filter.tag !== "undefined") {
      query.tagList = { $in: [filter.tag] };
    }
    if (typeof filter.userFeed !== "undefined") {
      User.findOne({ _id: filter.userFeed }).then(function(user) {
        // MEMO: adding requested user Id to list of following get personal feed
        let authorList = [...user.following, filter.userFeed];
        query.author = { $in: authorList };
      });
    }
  }

  Promise.all([
    filter !== "" ? User.findOne({ _id: filter.author_id }) : null,
    // filter.favorited !== '' ? User.findOne({username: filter.favorited}) : null
    User.findById(filter.favorited)
  ])
    .then(function(results) {
      let author = results[0];
      let favoriter = results[1];

      if (author) {
        query.author = author._id;
      }

      if (favoriter) {
        query._id = { $in: favoriter.favorites };
      } else if (req.query.favorited) {
        query._id = { $in: [] };
      }

      return Promise.all([
        Article.find(query)

          .limit(Number(limit))
          .skip(Number(offset))
          .sort({ createdAt: -1 })
          .populate("author")
          .exec(),
        Article.count(query).exec(),
        req.payload ? User.findById(req.payload.id) : null
      ]).then(function(results) {
        let articles = results[0];
        const articlesCount = results[1];
        let user = results[2];
        return res.json({
          articles: articles.map(function(article) {
            return article.toJSONFor(user);
          }),
          articlesCount: articlesCount
        });
      });
    })
    .catch(next);
});

router.post("/", function(req, res, next) {
  User.findById(req.body.newArt.author_id)
    .then(function(user) {
      if (!user) {
        return res.sendStatus(401);
      }
      let data = {
        ...req.body.newArt,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      let article = new Article(data);
      article.author = user;
      return article.save().then(function() {
        return res.json({ article: article.toJSONFor(user) });
      });
    })
    .catch(next);
});

// update article
router.put("/:article", function(req, res, next) {
  User.findById(req.body.articleInfo.author_id).then(function(user) {
    if (
      req.article.author._id.toString() ===
      req.body.articleInfo.author_id.toString()
    ) {
      if (typeof req.body.articleInfo.title !== "undefined") {
        req.article.title = req.body.articleInfo.title;
      }

      if (typeof req.body.articleInfo.description !== "undefined") {
        req.article.description = req.body.articleInfo.description;
      }

      if (typeof req.body.articleInfo.body !== "undefined") {
        req.article.body = req.body.articleInfo.body;
      }

      if (typeof req.body.articleInfo.tagList !== "undefined") {
        req.article.tagList = req.body.articleInfo.tagList;
      }

      req.article
        .save()
        .then(function(article) {
          return res.json({ article: article.toJSONFor(user) });
        })
        .catch(next);
    } else {
      return res.sendStatus(403);
    }
  });
});

// delete article
router.delete("/:article", function(req, res, next) {
  User.findById(req.query.id)
    .then(function(user) {
      if (!user) {
        return res.sendStatus(401);
      }

      if (req.article.author._id.toString() === req.query.id.toString()) {
        return req.article.remove().then(function() {
          return res.sendStatus(204);
        });
      } else {
        return res.sendStatus(403);
      }
    })
    .catch(next);
});

// return an article's comments
router.get("/:article/comments", function(req, res, next) {
  Promise.resolve(req.payload ? User.findById(req.payload.id) : null)
    .then(function(user) {
      return req.article
        .populate({
          path: "comments",
          populate: {
            path: "author"
          },
          options: {
            sort: {
              createdAt: -1
            }
          }
        })
        .execPopulate()
        .then(function(article) {
          return res.json({
            comments: req.article.comments.map(function(comment) {
              return comment.toJSONFor(user);
            })
          });
        });
    })
    .catch(next);
});

// create a new comment
router.post("/:article/comments", function(req, res, next) {
  let data = req.body;
  User.findById(data.newCom.author_id)
    .then(function(user) {
      if (!user) {
        return res.sendStatus(401);
      }
      data.newCom = { ...data.newCom, createdAt: new Date() };
      var comment = new Comment(data.newCom);

      comment.article = req.article;
      comment.author = user;

      return comment.save().then(function() {
        req.article.comments.push(comment);

        return req.article.save().then(function(article) {
          res.json(comment.toJSONFor(user));
        });
      });
    })
    .catch(next);
});

// Favorite an article
router.post("/:article/favorite", function(req, res, next) {
  let articleId = req.article._id;
  User.findById(req.body.id)
    .then(function(user) {
      if (!user) {
        return res.sendStatus(401);
      }

      return user.favorite(articleId).then(function() {
        return req.article.updateFavoriteCount().then(function() {
          return res.json(user);
        });
      });
    })
    .catch(next);
});

// Unfavorite an article
router.delete("/:article/favorite", function(req, res, next) {
  let articleId = req.article._id;

  User.findById(req.query.id)
    .then(function(user) {
      if (!user) {
        return res.sendStatus(401);
      }

      return user.unfavorite(articleId).then(function() {
        return req.article.updateFavoriteCount().then(function() {
          return res.json(user);
        });
      });
    })
    .catch(next);
});

module.exports = router;
