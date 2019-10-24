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

  if( typeof req.query.tag !== 'undefined' ){
    query.tagList = {"$in" : [req.query.tag]};
  }
  
  let filter = ''
  if( typeof req.query.filter !== 'undefined' ){
     filter = JSON.parse(req.query.filter);
     if ( typeof filter._id !== 'undefined') {
       query._id = {"_id" : new ObjectId(filter._id)};
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
        .sort({'createdAt': 1})
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

// router.get('/', async(req, res) => {
//   const objCollection = await loadArticleCollection();
//   const articles = objCollection.collection
//   const dbCollection = objCollection.client
//   let filter = {}
//   if(typeof req.query.filter !== 'undefined') {
//     filter = JSON.parse(req.query.filter)
//     if(typeof filter._id !== 'undefined') {
//      filter = {_id: new mongodb.ObjectID(filter._id)}
//     }
//   }
//   const response = await articles.find(filter).sort({ 'createdAt': -1 }).toArray()
//   const objUser =  await loadUsersCollection()
//   const profiles = objUser.collection
//   const dbUsers = objUser.client

//     const objFollow = await loadFollow()
//     const followDetails = objFollow.collection
//     const dbFollow = objFollow.client
  
//     let author = []
//     let newData = {}
//     let arrResp=[]
 
//     for (let index = 0; index < response.length; index++) {
      
//       newData = {}
//       author = await profiles.findOne({_id: new mongodb.ObjectID(response[index].author_id)})
//       const followRelay = await followDetails.findOne(
//       { follower_id:'5d99ac291c9d440000a96ee2', followed_id:response[index].author_id })
//       delete author['password'];
//       author = { ...author, follow: false }
//       if (followRelay !== null){
//         author = { ...author, follow: true }
//       } 
//       newData = { ...response[index], author }
//       arrResp.push(newData)
//       if (index === response.length-1) {
//         if(arrResp.length===1 && typeof filter._id !== 'undefined') {
//           arrResp = arrResp[0]
//         }
//         res.send(arrResp);
//         dbCollection.close()
//         dbUsers.close()
//         dbFollow.close()
//       }
//     }
// });

// router.get('/', async(req, res) => {
//   const objCollection = await loadArticleCollection();
//   const articles = objCollection.collection
//   const dbCollection = objCollection.client
//   let filter = {}
//   if(typeof req.query.filter !== 'undefined') {
//     filter = JSON.parse(req.query.filter)
//     if(typeof filter._id !== 'undefined') {
//      filter = {_id: new mongodb.ObjectID(filter._id)}
//     }
//   }
//   let response = await articles.find(filter).sort({ 'createdAt': -1 }).toArray()
//   if(response.length===1 && typeof filter._id !== 'undefined') {
//     response = response[0]
//   }
//   res.send(response);
//   dbCollection.close()
// })
// POST
// router.post('/', async(req, res) => {
//   const objCollection = await loadArticleCollection();
//   const articles = objCollection.collection
//   const dbCollection = objCollection.client
//   let newArt = {
//     title:req.body.newArt.title,
//     description:req.body.newArt.description,
//     body:req.body.newArt.body,
//     tagList:req.body.newArt.tagList,
//     author_id:req.body.newArt.author_id,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     favorited: false,
//     favoritesCount: 0
//   }
//    await articles.insertOne(newArt).then(result => {
//      newArt = {...newArt, _id:result.insertedId }
//       res.send(newArt)
//       dbCollection.close()
//     })
//    res.status(201).send();
// });

router.post('/', function(req, res, next) {
  User.findById(req.body.newArt.author_id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    var article = new Article(req.body.newArt);

    article.author = user;
    console.log("TCL: article", article)

    return article.save().then(function(){
      console.log(article.author);
      return res.json({article: article.toJSONFor(user)});
    });
  }).catch(next);
});

async function loadArticleCollection() {
  const client = await mongodb.MongoClient.connect('mongodb+srv://admin:6FAqp2Iz7bS6nqIk@cluster0-yha6u.mongodb.net/admin?retryWrites=true&w=majority', 
  {useNewUrlParser:true, useUnifiedTopology: true });
  const collection = client.db('ex-articles').collection('articles');
  return { collection, client };
}

async function loadFollow() {
  const client = await mongodb.MongoClient.connect('mongodb+srv://admin:6FAqp2Iz7bS6nqIk@cluster0-yha6u.mongodb.net/admin?retryWrites=true&w=majority', 
  {useNewUrlParser:true, useUnifiedTopology: true });
  const collection = client.db('ex-articles').collection('follow');
  return { collection, client };
}

async function loadUsersCollection() {
  const client = await mongodb.MongoClient.connect('mongodb+srv://admin:6FAqp2Iz7bS6nqIk@cluster0-yha6u.mongodb.net/admin?retryWrites=true&w=majority', 
  {useNewUrlParser:true, useUnifiedTopology: true });
  const collection = client.db('ex-articles').collection('users');
  return { collection, client };
}
module.exports = router;