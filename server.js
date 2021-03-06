const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');

const User = require('./auth/UserModel.js');

mongoose
    .connect('mongodb://localhost/auth-i')
    .then(() => {
        console.log('\n ===== Connected to database ===== \n');    
    })
    .catch(err => {
        console.log('Error connecting to database', err)
    });
    
const server = express();

// middleware
const sessionOptions = {
    secret: 'Can you keep a secret?',
    cookie: {
        maxAge: 1000 * 60 * 60, // this is equivalent to an hour
    },
    httpOnly: true,
    secure: false,
    resave: true,
    saveUninitialized: false,
    name: 'noname',
};

function protected(req, res, next) {
    if (req.session && req.session.username) {
        next();
    } else {
        res.status(401).json({ Message: 'Please enter correct username or password.' });
    }
}

server.use(express.json());
server.use(session(sessionOptions));

server.get('/api/users', protected, (req, res) => {
    User.find()
        .then(users => res.json(users))
        .catch(err => res.json(err));
});

server.get('/', (req, res) => {
    if (req.session && req.session.username) {
        res.status(200).json({ message: `Welcome back, ${req.session.username}` });
    } else {
        res.status(401).json({ message: 'You need to login to continue.' });
    }
});

// server.get('/', (req, res) => {
//     res.status(200).json({ message: 'Your API is now running.' });
// });

server.post('/api/register', (req, res) => {
    // save the user to the database

    // const user = new User(req.body);
    // user.save().then().catch();

    // or an alternative syntax would be this:
    User.create(req.body)
        .then(user => {
            res.status(201).json({ message: 'New user created.' });
        })
        .catch(err => {
            res.status(500).json({ message: 'Error in creating new user.' });
        });
});

server.post('/api/login', (req, res) => {
    // grab credentials
    const { username, password } = req.body;

    // find the user to get access to the store password
    User.findOne({ username })
        .then(user => {
            if (user) {
                // compare password guess to the stores password
                user
                    .validatePassword(password)
                    .then(passwordsMatch => {
                        // the passwords match, they can continue
                        if (passwordsMatch) {
                            req.session.username = user.username;
                            res.send(`Here, this cookie is for you. But don't eat it.`);
                        } else {
                            res.status(401).send('Incorrect username or password.');
                        }
                    })
                    .catch(err => {
                        res.send('Incorrect username or password. You shall not pass!');
                    });
            } else {
                // if not found
                res.status(401).send('Unauthorized access');
            }
        })
        .catch(err => {
            res.send(err);
        });
});

server.get('/api/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                res.send('Error logging out.');
            } else {
                res.send('So long, farewell.');
            }
        });
    }
});

server.listen(8333, () => {
    console.log('\n ===== API running on Port 8333 ===== \n');
});