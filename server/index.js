const express = require('express');
const bodyPaser = require('body-parser');
const session = require('express-session');
const massive = require('massive');

require('dotenv').config();
const app = express();
massive(process.env.CONNECTION_STRING).then( db => app.set('db', db) );

app.use(bodyPaser.json());
app.use(session({
  secret: "mega hyper ultra secret",
  saveUninitialized: false,
  resave: false,
}));
app.use(express.static(`${__dirname}/../build`));

app.post('/register', (req, res) => {
  // Add code here
  const db = app.get('db');

  //The user object is created for the session 
  const { username, password } = req.body;
  db.create_user([username, password]).then( () => {
    req.session.user = { username };
    res.json({ user: req.session.user });
  }).catch( err => {
    console.log( err );
    res.status(500).json({ message: 'Something wrong'});
  });
});

app.post('/login', (req, res) => {
  // Add code here
  req.session.destroy();
  res.status(200).send();
});

app.post('/logout', (req, res) => {
  // Add code here
});

function ensureLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(403).json({ message: 'You are not authorized' });
  }
}

app.get('/secure-data', ensureLoggedIn, (req, res) => {
  res.json({ someSecureData: 123 });
});

const PORT = 3030;
app.listen(PORT, () => {
  console.log('Server listening on port ' + PORT);
});
