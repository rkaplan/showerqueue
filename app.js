(function(){
  "use strict";

  /**
   * Module dependencies.
   */

  var express   = require('express'),
      routes    = require('./routes').routes,
      user      = require('./routes/user'),
      http      = require('http'),
      schemas   = require("./app/schemas.js"),
      mongoose  = require("mongoose"),
      conf      = require('nconf').argv().env().file({file: __dirname + '/config.json'}),
      _         = require("underscore"),
      path      = require('path');

  var app = express();

  mongoose.connect(conf.get("mongo"));

  // all environments
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express["static"](path.join(__dirname, 'public')));

  // development only
  if ('development' === app.get('env')) {
    app.use(express.errorHandler());
  }

  _.each(routes, function(route){
    var methods = route[4] || ["get"];

    methods.forEach(function(method){
      var params = [];

      if (route[2]){
        params.push(function(req, res, next){
          req._schemas = schemas;
          next();
        });
      }
      if (route[3]){
        params.push(function(req, res, next){
          req._conf = conf;
          next();
        });
      }
      app[method](route[0], params, route[1]);
    });
  });

  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });
}());
