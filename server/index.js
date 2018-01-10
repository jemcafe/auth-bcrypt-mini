const express = require('express');
const bodyPaser = require('body-parser');
const session = require('express-session');
const massive = require('massive');
const bcrypt = require('bcrypt');

const saltRounds = 12;

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
  // Database instance
  const db = app.get('db');

  // The username and password from the client
  const { username, password } = req.body;

  // bcrypt takes the password and changes it
  bcrypt.hash(password, saltRounds).then( hashedPassword => {

    db.create_user([username, hashedPassword]).then( () => {
        req.session.user = { username: username };
        res.json({ user: req.session.user });
      }).catch( err => {
        console.log( err );
        res.status(500).json({ message: 'Something wrong'});
      });

  });
  
});

app.post('/login', (req, res) => {
  // Database instance
  const db = app.get('db');

  // The username and password from the client
  const { username, password } = req.body;

  // Finds the given username in the database
  db.find_user([username]).then( users => {

    // If there are any users
    if (users.length) {
      // passwords are compared
      bcrypt.compare(password, users[0].password).then( passwordMatch => {

        // If the passwords match, the session object's username is the given username
        if ( passwordMatch ) {
          req.session.user = { username: users[0].username };
          res.json({ user: req.session.user });
        } else {
          res.status(403).json({ message: 'Wrong password' })
        }
        
      });
      
    } else {
      res.status(403).json({ message: "That user is not registered" })
    }

  })
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.status(200).send();
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
