const express = require('express')
const mongodb = require('mongodb')
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');

// Preload user profile on routes with ':userid'
router.param('userid', function(req, res, next, userid){
  User.findById(userid).then(function(user){
    if (!user) { return res.sendStatus(404); }
    req.profile = user;
    return next();
  }).catch(next);
});

// GET user profile
router.get('/', function(req, res, next){
  if(req.query){
    User.findById(req.query.profileId).then(function(user){
      if(!user){ return res.json({profile: req.query.toProfileJSONFor(false)}); }
      return res.json(user);
    });
  } else {
    return res.json({profile: req.query.toProfileJSONFor(false)});
  }
});

// PUT
router.put('/', async (req, res)=>{
  const objUsers = await loadUsersCollection();
  const users = objUsers.collection
  const dbUsers = objUsers.client
  await users.updateOne(
    {
    _id:new mongodb.ObjectID(req.body.user._id)
    },
    {
      $set : {
        email : req.body.user.email,
        username: req.body.user.username,
        bio: req.body.user.bio,
        image: req.body.user.image,
        favorites: [],
        following: []
      }
    }
  ).then(()=>{
    res.send(req.body.user);
    dbUsers.close()
  })
  res.status(200).send();
})

router.post('/:userid/follow', function(req, res, next){
  var profileId = req.profile._id;
  User.findById(req.body.id).then(function(user){

    if (!user) { return res.sendStatus(401); }

    return user.follow(profileId).then(function(){
      return res.json(user);
    });
  }).catch(next);
});

router.delete('/:userid/follow', function(req, res, next){
  var profileId = req.profile._id;
  User.findById(req.query.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    return user.unfollow(profileId).then(function(){
      return res.json(user);
    });
  }).catch(next);
});

async function loadUsersCollection() {
  const client = await mongodb.MongoClient.connect('mongodb+srv://admin:6FAqp2Iz7bS6nqIk@cluster0-yha6u.mongodb.net/admin?retryWrites=true&w=majority', 
  {useNewUrlParser:true, useUnifiedTopology: true });
  const collection =  client.db('ex-articles').collection('users');
  return { collection, client }
}

module.exports = router;