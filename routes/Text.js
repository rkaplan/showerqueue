(function(){
  "use strict";
  var _          = require("underscore"),
      //Controller = require("Controller"),
      twilio     = require("twilio"),
      conf       = require('nconf').argv().env().file({file: __dirname + '/../config.json'}),

      dispatch, handler,
      handlePost,
      createUser,
      OUR_NUMBER = conf.get("twilio:number");

  // setup twilio
  twilio = twilio(conf.get("twilio:accountId"), conf.get("twilio:authToken"));

  handlePost = function(req, res, next){
    //var controller = new Controller(req._schemas);

    var number = req.body.number;
    var isUser = false;
    //controller.numberExists(number, function(err, isUser){
      if (isUser){

      } else {
        return createUser(req, res, next);
      }
    //});
  };

  createUser = function(req, res, next){
    var cookie = req.cookies.shower, state;
    if (!cookie){
      cookie = {};
    } else {
      state  = cookie.state;
    }
    console.log("got text", cookie.state);
    // remove all whitespace from the body
    if (_.isUndefined(state) || _.isNull(state)){
      twilio.sendMessage({
        to: req.body.from,
        from: OUR_NUMBER,
        body: "Welcome to the Shower Master. What's your name?"
      });
      cookie.state = "name";
    } else if (state === "name"){
      var name = req.body.Body.replace(/\s+/g, '');
      twilio.sendMessage({
        to: req.body.from,
        from: OUR_NUMBER,
        body: "Awesome. Nice to meet you " + name + ". I'm THE SHOWER MASTER." +
              "Let's get this started. What dorm are you in?"
      });
      cookie.state = "dorm";
      var user = {
        name: name
      };
      cookie.user = user;
    } else if (state === "dorm"){
      var dorm = req.body.Body.replace(/\s+/g, '');
      twilio.sendMessage({
        to: req.body.from,
        from: OUR_NUMBER,
        body: "Nice!" + dorm + " is pretty cool. What floor you on bro?"
      });
      cookie.state     = "floor";
      cookie.user.dorm = dorm;
    } else if (state === "floor"){
      var floor = req.body.Body.replace(/\s+/g, '');
      twilio.sendMessage({
        to: req.body.from,
        from: OUR_NUMBER,
        body: "Cool. One last thing. Are you a boy or a girl?" +
              "I'm not very smart, so please only respond with the word boy or girl."
      });
      cookie.state      = "sex";
      cookie.user.floor = floor;
    } else if (state === "sex"){
      var sex = req.body.Body.replace(/\s+/g, '');
      twilio.sendMessage({
        to: req.body.from,
        from: OUR_NUMBER,
        body: "Alright, you are ready to get your shower on." +
              "Whenever you want to take a shower just text shower to me. Have fun!"
      });
      console.log("Creating user", cookie.user);
    }
    res.cookie("shower", cookie);
    return res.send();
  };

  dispatch = {POST: handlePost};
  handler = function(req, res, next){
    if (_.has(dispatch, req.method)){
      return dispatch[req.method](req, res, next);
    }
    return next(405);
  };
  module.exports = handler;
}());
