// const MongoClient = require('mongodb').MongoClient;
const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, client) => {
  if (err) {
    return console.log('Unable to connect to MongoDB server');
  }
  console.log('Connected to MongoDB server');
  const db = client.db('TodoApp');

  db.collection('Todos').findOneAndUpdate({_id: new ObjectID('5a7cb321b94b105a8f5231e1')},
    {
      $set: {
        completed: true
      },
      
    }, 
    {
      returnOriginal: false
    }
  ).then((result) => {
    console.log(result);
  });

  db.collection('Users').findOneAndUpdate({_id: new ObjectID('5a7c982bb45d33251c4b5700')},
  {
    $set: {
      name: 'Jaime'
    },
    $inc: { age: 1} 
  },
  {
    returnOriginal: false
  },

).then((result) => {
  console.log(result);
});

  // client.close();
});