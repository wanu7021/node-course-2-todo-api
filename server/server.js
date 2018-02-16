require('./config/config');

const _ = require('lodash');
var express = require('express');
var bodyParser = require('body-parser');
var {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

var app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {
  const todo = new Todo({
    text: req.body.text,
    _creator: req.user._id
  });
  todo.save().then((doc) => {
    res.send(doc);
  }).catch((e) => {
    res.status(400).send(e);
  });
});

app.get('/todos', authenticate, (req, res) => {
  Todo.find({
    _creator: req.user._id
  }).then( todos => {
    res.send({todos});
  }).catch( e => {
    res.status(400).send(e);
  });
});

app.get('/todos/:id', authenticate, (req, res) => {
  const id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  } 
  Todo.findOne({
    _id: id,
    _creator: req.user._id
  }).then( todo => {
    if (todo) {
      res.send({todo});
    } else {
      res.status(404).send();
    }
    }).catch( e => {
      res.status(400).send(e);
  });
});

app.delete('/todos/:id', authenticate, async (req, res) => {
  const id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  try {
    const todo = await Todo.findOneAndRemove({
      _id: id,
      _creator: req.user._id
    });
    if (todo) {
      res.send({todo});
    } else {
      res.status(404).send();
    }
  } catch (e) {
    res.status(400).send(e);
  }
});

app.patch('/todos/:id', authenticate, async (req, res) => {
  const id = req.params.id;
  const body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  } 
  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  try {
    const todo = await Todo.findOneAndUpdate({
      _id: id,
      _creator: req.user.id
    }, {
      $set: body
    }, {
      new: true
    });

    if (!todo) {
      return res.status(404).send();
    }
    res.send({todo});
  } catch (e) {
    res.status(400).send();
  }
});

app.post('/users', async (req, res) => {
  try {
    const body = _.pick(req.body, ['email', 'password']);
    const user = new User(body);
    await user.save();
    const token = await user.generateAuthToken();
    res.header('x-auth', token).send(user);  
  } catch (e) {
    res.status(400).send(e);
  }
});

app.post('/users/login', async (req, res) => {
  try {
    const body = _.pick(req.body, ['email', 'password']);
    const user = await User.findByCredentials(body.email, body.password);
    const token = await user.generateAuthToken();
    res.header('x-auth', token).send(user);
  } catch (e) {
    res.status(400).send();
  }
});

app.delete('/users/me/token', authenticate, async (req, res) => {
  try{
    await req.user.removeToken(req.token);
    res.send();      
  } catch (e) {
    res.status(400).send();
  }
  req.user.removeToken(req.token).then(() => {
    res.send();    
  }).catch( e => {
    res.status(400).send();
  });
})

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});

module.exports = {app};