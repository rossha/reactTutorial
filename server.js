// recommendation of how to organize module imports:
//
// 1. Core Node.js modules — path, querystring, http.
// 2.Third-party NPM libraries — mongoose, express, request.
// 3. Application files — controllers, models, config.
//

var async = require('async');
var request = require('request');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
// swig is a templating middleware, similar to Jade or Handlebars
var swig = require('swig');
var React = require('react');
var Router = require('react-router');
var routes = require('./app/routes');
var mongoose = require('mongoose');
var Character = require('./models/character');
var config = require('./config');

// to connect to database, add between module dependencies and Express middlewares
// establishes a connection pool with MongoDB when we start the Express app
// database hostname is set in config.js to avoid hardcoding the value here
mongoose.connect(config.database);
mongoose.connection.on('error', function() {
  console.info('Error: Couldn\'t connect to MongoDB. Did you forget to run \'mongod\'?');
});

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(logger('dev)'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

/**
* POST /api/characters 
* adds new character to the database
***/
app.post('/api/characters', function(req, res, next) {
  var gender = req.body.gender;
  var characterName = req.body.name;
  var characterIdLookupUrl = 'https://api.eveonline.com/eve/CharacterID.xml.aspx?names=' + characterName;

  var parser = new xml2js.Parser();

  async.waterfall([
    function(callback) {
      request.get(characterIdLookupUrl, function(err, request, xml) {
        if(err) return next(err);
        parser.parseString(xml, function(err, parsedXml) {
          if(err) return next(err);
          try {
            var characterId = parsedXml.eveapi.result[0].rowset[0].row[0].$.characterID;

            Character.findOne({ characterId: characterId }, function(err, character) {
              if (err) return next(err);

              if(character) {
                return res.status(409).send({ message: character.name + ' is already in the database.' });
              }

              callback(err, characterId);
            });
          } catch (e) {
            return res.status(400).send({ message: 'XML Parse Error' });
          }
        });
      });
    },
    function(characterId) {
      var characterInfoUrl = 'https://api.eveonline.com/eve/CharacterInfo.xml.aspx?characterID=' + characterId;

      request.get({ url: characterInfoUrl }, function(err, request, xml) {
        if(err) return next(err);
        parser.parseString(xml, function(err, parsedXml) {
          if(err) return res.send(err);
          try {
            var name = parsedXml.eveapi.result[0].characterName[0];
            var race = parsedXml.eveapi.result[0].race[0];
            var bloodline = parsedXml.eveapi.result[0].bloodline[0];

            var character = new Character({
              characterId: characterId,
              name: name,
              race: race,
              bloodline: bloodline,
              gender: gender,
              random: [Math.random(), 0]
            });

            character.save(function(err) {
              if(err) return next(err);
              res.send({ message: characterName + ' has been added successfully!' });
            });
          } catch (e) {
            res.status(404).send({ message: characterName + ' is not a registered citizen of New Eden.'});
          }
        });
      });
    }
  ]);
});

app.use(function(req, res) {
  Router.run(routes, req.path, function(Handler) {
    var html = React.renderToString(React.createElement(Handler));
    var page = swig.renderFile('views/index.html', { html: html });
    res.send(page);
  });
});

/**
* Socket.io stuff
*/
var server = require('http').createServer(app);
var io = require('socket.io')(server);

// onlineUsers is a global variable
var onlineUsers = 0;

io.sockets.on('connection', function(socket) {
  onlineUsers++;

  io.sockets.emit('onlineUsers', { onlineUsers: onlineUsers });

  socket.on('disconnect', function() {
    onlineUsers--;
    io.sockets.emit('onlineUsers', { onlineUsers: onlineUsers });
  });
});

server.listen(app.get('port'), function() {
  console.log('Server boogie gettin\' down on port ' + app.get('port'));
});