const express = require('express')
const mongodb = require('mongodb')
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');

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
        image: req.body.user.image
      }
    }
  ).then(()=>{
    res.send(req.body.user);
    dbUsers.close()
  })
  res.status(200).send();
})

async function loadUsersCollection() {
  const client = await mongodb.MongoClient.connect('mongodb+srv://admin:6FAqp2Iz7bS6nqIk@cluster0-yha6u.mongodb.net/admin?retryWrites=true&w=majority', 
  {useNewUrlParser:true, useUnifiedTopology: true });
  const collection =  client.db('ex-articles').collection('users');
  return { collection, client }
}

module.exports = router;