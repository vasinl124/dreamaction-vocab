'use strict';

let express = require('express');
let app = express();

let hbs = require('hbs');
let bcrypt = require('bcryptjs');

let PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'));

let schedule = require('node-schedule');


let vocabDB = new PouchDB('vocabDB');
let categoryDB = new PouchDB('categoryDB');
let userDB = new PouchDB('userDB');
let wordoftheday = new PouchDB('wordoftheday');

// let vocabDB = new PouchDB('http://127.0.0.1:15984/vocabDB');
// let categoryDB = new PouchDB('http://127.0.0.1:15984/categoryDB');
// let userDB = new PouchDB('http://127.0.0.1:15984/userDB');
// let wordoftheday = new PouchDB('http://127.0.0.1:15984/wordoftheday');
// let vocabDB = new PouchDB('http://admin:damnshit@127.0.0.1:5984/vocabdb');
// let categoryDB = new PouchDB('http://admin:damnshit@127.0.0.1:5984/categorydb');
// let userDB = new PouchDB('http://admin:damnshit@127.0.0.1:5984/userdb');
// let wordoftheday = new PouchDB('http://admin:damnshit@127.0.0.1:5984/wordoftheday');

PouchDB.sync('vocabDB','http://admin:damnshit@127.0.0.1:5984/vocabdb');
PouchDB.sync('categoryDB','http://admin:damnshit@127.0.0.1:5984/categorydb');
PouchDB.sync('userDB','http://admin:damnshit@127.0.0.1:5984/userdb');
PouchDB.sync('wordoftheday','http://admin:damnshit@127.0.0.1:5984/wordoftheday');

let j = schedule.scheduleJob('22 22 * * *', function(){
  console.log('The answer to life, the universe, and everything!');

  vocabDB.allDocs().then(function (res) {
    var ids = res.rows.map(function (row) { return row.id; });
    var index = Math.floor(Math.random() * ids.length);
    console.log(ids[index]);
    if (ids[index] !== "_design/category_all_query"){
      return wordoftheday.get('wordoftheday').then(function(doc) {
        return wordoftheday.put({
          _id : 'wordoftheday',
          _rev: doc._rev,
          word_id : ids[index]
        });
      }).then(function(response) {
      // handle response
      }).catch(function (err) {
        console.log("err : ==>", err);
        wordoftheday.put({
          _id : 'wordoftheday',
          word_id : ids[index]
        });
      });
    }
  }).then(function (res) {
  }).catch(console.log.bind(console));
});

// categoryDB.put({
//   _id: 'environment',
//   category: 'Environment'
// }).then(function(response){
//   console.log(response);
// }).catch(function(err){
//   console.log(err);
// })

// signup();
// function signup() {
//   var salt = bcrypt.genSaltSync(10);
//
//   userDB.post({
//     username: 'jomjom',
//     password: bcrypt.hashSync('#damnshit', salt)
//   }, function(err, response){
//     if(err) {
//       return console.log(er)
//     } else {
//       console.log(response);
//     }
//   })
// }

// userDB.createIndex({
//     index: {
//       fields: ['username', 'password']
//     }
// }).then(function (result) {
//   console.log("result", result);
//   // yo, a result
// }).catch(function (err) {
//   console.log("err", err);
//   // ouch, an error
// });
//
//
// vocabDB.createIndex({
//   index: {
//     fields: ['category']
//   }
// }).then(function (result) {
//   console.log("result", result);
//   // yo, a result
// }).catch(function (err) {
//   console.log("err", err);
//   // ouch, an error
// });

let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
// let FacebookStrategy = require('passport-facebook').Strategy;
// let GoogleStrategy = require('passport-google-oauth').Strategy;
//
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let expressSession = require('express-session');


app.use(cookieParser());
app.use(bodyParser());
app.use(expressSession({
  secret: 'MySèCRêTTOKENDüde',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// used to serialize the user for the session
passport.serializeUser(function(user, done) {
  console.log(user);
    done(null, user._id);
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
  console.log("id: ", id);
  userDB.find({
    selector: {
      _id : {'$eq': id}
    }
  }).then(function(res){
    done(null, res.docs[0]);
  }).catch(function(err){
    console.log(err);
  })

});

passport.use(new LocalStrategy(
  function(username, password, done) {
    userDB.find({
      selector: {
        username : {'$eq': username}
      }
    }).then(function(res){
      if (bcrypt.compareSync(`#${password}`, res.docs[0].password)){
        done(null, res.docs[0]);
      } else {
        done(null, 'failed authenticated');
      }
    }).catch(function(err){
      console.log(err);
    })
  }
));

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    console.log("isAuthenticated: ", req.isAuthenticated());
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('login');
}

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

// API END POINT
app.get('/', function(req, res){
  categoryDB.allDocs({include_docs: true}).then(function(result){
    wordoftheday.get('wordoftheday').then(function(doc) {
      vocabDB.get(doc.word_id).then(function(d){
        result.wordoftheday = d;
        result.view = function(){
          return 'main';
        }
        result.title = 'DreamAction Vocab - รวมคำศัพท์ทางสถาปัตย์เพื่อสถาปนิก';

        res.render('index', result);
      })
    }).catch(console.log.bind(console));
  })
})

app.get('term/:id', function(req, res){
  vocabDB.get(req.params.id).then(function(doc){
    doc.view = function(){
      return 'vocab';
    }

    doc.title = `ความหมายของ ${req.params.id} - Dream Action`;

    res.render('index', doc);
  })
})

app.get('category/:id', function(req, res){

  function myMapFunction(doc){
    console.log(doc)
    if(doc.category){
        emit(doc.category);
    }
  }

  if (req.params.id !== 'All'){
    vocabDB.query(myMapFunction , {
      startkey: [req.params.id]
      , endkey: [req.params.id, {}],
      include_docs : true
    }).then(function(result){
      console.log(result);

      result.view = function(){
        return 'category';
      }

      result.title = `คำศัพท์ในหมวด ${req.params.id} - Dream Action`;

      result.category_name = req.params.id;
      res.render('index', result);
    }).catch(function(err){
      console.log(err);
    })
  } else {
    vocabDB.query(myMapFunction , {
      include_docs : true
    }).then(function(result){
      console.log(result);

      result.view = function(){
        return 'category';
      }

      result.title = `รวมคำศัพท์ทุกหมวด`;
      result.category_name = req.params.id;
      res.render('index', result);
    }).catch(function(err){
      console.log(err);
    })
  }
})


app.get('admin', isLoggedIn, function(req, res){
  var doc = {};
  doc.view = function(){
    return 'admin';
  }
  res.render('index', doc );
})


app.post('addVocab', function(req, res){
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
      category: [req.body.category]
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

// Search
app.get('search', function(req, res){
  console.log(req.query);
  console.log(req.query.term);

  function myMapFunctions(doc){
    console.log("======>", doc);
    emit(doc._id, doc.word, doc.definition);
  }

    vocabDB.query(myMapFunctions, {
      startkey: req.query.term.toLowerCase(),
      endkey: req.query.term.toLowerCase() + '\uffff',
      // endkey: [req.query.term.toLowerCase(), {}],
      include_docs : true
    }).then(function(result){
      console.log(result);
      console.log(result.rows);
      result.view = function(){
        return 'search';
      }
      result.keyword = req.query.term;
      result.title = `ค้นหาคำศัพท์จากคีย์เวิร์ด ${req.query.term} - Dream Action`;
      res.render('index', result);
    }).catch(function(err){
      console.log(err);
    })

})



// LOGIN AUTH END POINT
app.get('login',function(req, res){
  var result = {};
  result.view = function(){
    return 'login';
  }
  res.render('index', result);
});

app.post('login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('admin');
  });


app.get('logout', function(req, res) {
  req.logout();
  res.redirect('login');
});


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
