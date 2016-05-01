'use strict';

let express = require('express');
let bodyParser = require('body-parser');
let app = express();

let hbs = require('hbs');

let PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));


let vocabDB = new PouchDB('http://127.0.0.1:15984/vocabDB');
let categoryDB = new PouchDB('http://127.0.0.1:15984/categoryDB');

// categoryDB.put({
//   _id: 'environment',
//   category: 'Environment'
// }).then(function(response){
//   console.log(response);
// }).catch(function(err){
//   console.log(err);
// })

vocabDB.createIndex({
  index: {
    fields: ['category']
  }
}).then(function (result) {
  console.log("result", result);
  // yo, a result
}).catch(function (err) {
  console.log("err", err);
  // ouch, an error
});

// let passport = require('passport');
// let FacebookStrategy = require('passport-facebook').Strategy;
// let GoogleStrategy = require('passport-google-oauth').Strategy;
//
// let cookieParser = require('cookie-parser');
// let bodyParser = require('body-parser');
// let expressSession = require('express-session');

// app.use(cookieParser());
// app.use(bodyParser());
// app.use(expressSession({ secret: 'keyboard cat' }));
// app.use(passport.initialize());
// app.use(passport.session());

// // used to serialize the user for the session
// passport.serializeUser(function(user, done) {
//   console.log(user);
//     done(null, user.id);
// });
//
// // used to deserialize the user
// passport.deserializeUser(function(id, done) {
//   console.log("id: ", id);
//   done(null, id);
//     // User.findById(id, function(err, user) {
//     //     done(err, user);
//     // });
// });


// passport.use(new FacebookStrategy({
//     clientID: '216032315415124',
//     clientSecret: '6a0d77f1a4e2e1c8312bd46dbed89727',
//     callbackURL: "http://localhost:3000/auth/facebook/callback"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     console.log('accessToken', accessToken);
//     console.log('refreshToken', refreshToken);
//     console.log('profile', profile);
//     console.log('cb', cb);
//
//     return cb(null, profile);
//     // User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//     //   return cb(err, user);
//     // });
//   }
// ));

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

hbs.registerPartials(__dirname + '/partials/');


app.listen(3000,function(){
  console.log('App is listening on port 3000');
})

app.get('/', function(req, res){
  categoryDB.allDocs({include_docs: true}).then(function(result){
    console.log(result);
    result.view = function(){
      return 'main';
    }
    res.render('index', result);
  })
})

app.get('/vocab/:id', function(req, res){
  vocabDB.get(req.params.id).then(function(doc){
    doc.view = function(){
      return 'vocab';
    }
    res.render('index', doc);
  })
})

app.get('/category/:id', function(req, res){
    if(req.params.id !== 'All') {
      vocabDB.find({
        selector: {category: {$eq: req.params.id}},
        fields: ['_id', 'category', 'word', 'definition'],
        sort: ['category']
      }).then(function (result) {
        result.view = function(){
          return 'category';
        }
        result.category_name = req.params.id;
        res.render('index', result);
      }).catch(function (err) {
        console.log("err -->", err);
      });
    } else {
      vocabDB.find({
        selector: {_id : {$gt : null }},
        fields: ['_id', 'category', 'word', 'definition'],
        sort: ['_id']
      }).then(function (result) {
        result.view = function(){
          return 'category';
        }
        res.render('index', result);
      }).catch(function (err) {
        console.log("err -->", err);
      });
    }

})


app.get('/admin', function(req, res){
  var doc = {};
  doc.view = function(){
    return 'admin';
  }
  res.render('index', doc );
})


app.post('/addVocab', function(req, res){
  //add to database
  vocabDB.get(req.body.word.toLowerCase()).then(function(doc) {
    console.log("doc", doc);
  }).then(function(response) {
    // handle response
  }).catch(function (err) {
    vocabDB.put({
      _id: req.body.word.toLowerCase(),
      word: req.body.word,
      definition: req.body.definition,
      example: req.body.example,
      category: req.body.category
    }).then(function (response) {
      doc.message = 'Success!!';
      // handle response
    }).catch(function (err) {
      console.log(err);
      doc.message = 'Error!!';
    });

  });
  // add success or error message to view...

  res.redirect('admin');
})


app.get('/login');
app.post('/login');
app.post('/logout');


//
// app.get('/auth/facebook',
//   passport.authenticate('facebook'));
//
// app.get('/auth/facebook/callback',
//   passport.authenticate('facebook', { failureRedirect: '/login' }),
//   function(req, res) {
//     console.log('-----===============------------->');
//     console.log(res);
//     console.log('-----===============------------->');
//     // Successful authentication, redirect home.
//
//     res.send(res.user);
//     res.redirect('/');
//   });
