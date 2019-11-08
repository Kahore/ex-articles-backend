const express = require('express')
const mongodb = require('mongodb')

const router = express.Router();

router.get('/', async(req, res) => {
  let user = []
  const objUsers = await loadUsersCollection()
  const users = objUsers.collection
  const dbUsers = objUsers.client
  
  let param = JSON.parse(req.query.user)
    user = await users.find({email: param.email, password:param.password }).toArray()
    user = user[0]
    res.send(user);
  dbUsers.close();
})

router.post('/', async(req, res) => {
  const objCollection = await loadUsersCollection();
  const users = objCollection.collection
  const dbCollection = objCollection.client
    let newUser = {
    email: req.body.user.email,
    username: req.body.user.username,
    password: req.body.user.password,
    bio: '',
    image: ''
  }
  await users.insertOne(newUser).then(result => {
    newUser = {...newUser, _id:result.insertedId }
    res.send(newUser)
    dbCollection.close()
  })
  res.status(201).send();
});

async function loadUsersCollection() {
  const client = await mongodb.MongoClient.connect('mongodb+srv://admin:6FAqp2Iz7bS6nqIk@cluster0-yha6u.mongodb.net/admin?retryWrites=true&w=majority', 
  { useNewUrlParser:true, useUnifiedTopology: true });
  const collection = client.db('ex-articles').collection('users');
  return { collection, client }
}

module.exports = router;