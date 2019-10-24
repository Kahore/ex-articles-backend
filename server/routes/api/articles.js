const express = require('express')
const mongodb = require('mongodb')


const mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectId;

const router = express.Router();
const User = mongoose.model('User');
const Article = mongoose.model('Article');

// GET
router.get('/', function(req, res, next) {
  var query = {};
  var limit = 20;
  var offset = 0;

  if(typeof req.query.limit !== 'undefined'){
    limit = req.query.limit;
  }

  if(typeof req.query.offset !== 'undefined'){
    offset = req.query.offset;
  }

  // if( typeof req.query.tag !== 'undefined' ){
  //   query.tagList = {"$in" : [req.query.tag]};
  // }
  
  let filter = ''
  if( typeof req.query.filter !== 'undefined' ){
    filter = JSON.parse(req.query.filter);
    if ( typeof filter._id !== 'undefined') {
      query._id = {"_id" : new ObjectId(filter._id)};
    }
    if( typeof filter.tag !== 'undefined' ){
      query.tagList = {"$in" : [filter.tag]};
    }
  }

  Promise.all([
    filter !== '' ? User.findOne({_id: filter.author_id}) : null,
    req.query.favorited ? User.findOne({username: req.query.favorited}) : null
  ]).then(function(results){
    var author = results[0];
    var favoriter = results[1];

    if(author){
      query.author = author._id;
    }

    if(favoriter){
      query._id = {$in: favoriter.favorites};
    } else if(req.query.favorited){
      query._id = {$in: []};
    }
    return Promise.all([
      Article.find(query)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({'createdAt': -1})
        .populate('author')
        .exec(),
      Article.count(query).exec(),
      req.payload ? User.findById(req.payload.id) : null,
    ]).then(function(results){

      let articles = results[0];
      const articlesCount = results[1];
      let user = results[2];
      return res.json({
        articles: articles.map(function(article){
          return article.toJSONFor(user);
        }),
        articlesCount: articlesCount
      });
    });
  }).catch(next);
});

router.post('/', function(req, res, next) {
  User.findById(req.body.newArt.author_id).then(function(user){
    if (!user) { return res.sendStatus(401); }
    let data = {...req.body.newArt, createdAt: new Date(), updatedAt: new Date()}
    let article = new Article(data);
    article.author = user;
    return article.save().then(function(){
      return res.json({article: article.toJSONFor(user)});
    });
  }).catch(next);
});

module.exports = router;