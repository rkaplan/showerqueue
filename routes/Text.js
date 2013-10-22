(function(){
  "use strict";
  var _          = require("underscore"),
      //Controller = require("Controller"),
      twilio     = require("twilio"),
      conf       = require('nconf').argv().env().file({file: __dirname + '/../config.json'}),

      dispatch, handler,
      handlePost,
      createUser,
      askForName, askForDorm, askForFloor, askForSex, setupUser,
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
    var cookie = req.cookies.shower, state, user;
    if (!cookie){
      cookie = {};
    } else {
      state  = cookie.state;
    }
    var functions = {
      name: askForDorm,
      dorm: askForFloor,
      floor: askForSex,
      sex: setupUser
    };
    if (_.has(functions, state)){
      return functions[state](req, res, next);
    }
    askForName(req, res, next);
  };

  askForName = function(req, res, next){
    var cookie = {};
    twilio.sendMessage({
      to: req.body.From,
      from: OUR_NUMBER,
      body: "Welcome to the Shower Master. What's your name?"
    }, function(err){
      console.log("sent", err);
    });
    cookie.state = "name";
    res.cookie("shower", cookie);
    return res.send("Hi Twilio.");
  };

  askForDorm = function(req, res, next){
    var cookie = req.cookies.shower;
    var name   = req.body.Body;
    twilio.sendMessage({
      to: req.body.From,
      from: OUR_NUMBER,
      body: "Nice to meet you " + name + ". I'm THE SHOWER MASTER. " +
            "Let's get this started. What dorm are you in?"
    });
    cookie.state = "dorm";
    var user = {
      name: name
    };
    cookie.user = user;
    res.cookie("shower", cookie);
    return res.send("Hi Twilio.");
  };

  askForFloor = function(req, res, next){
    var cookie = req.cookies.shower;
    var dorm = req.body.Body.replace(/\s+/g, '');
    twilio.sendMessage({
      to: req.body.From,
      from: OUR_NUMBER,
      body: "Nice! " + dorm + " is pretty cool. What floor you on bro?"
    });
    cookie.state     = "floor";
    cookie.user.dorm = dorm;
    res.cookie("shower", cookie);
    return res.send("Hi Twilio.");
  };

  askForSex = function(req, res, next){
    var cookie = req.cookies.shower;
    var floor = req.body.Body.replace(/\s+/g, '');
    twilio.sendMessage({
      to: req.body.From,
      from: OUR_NUMBER,
      body: "Cool. One last thing. Are you a boy or a girl? " +
            "I'm not very smart, so please only respond with the word boy or girl."
    });
    cookie.state      = "sex";
    cookie.user.floor = floor;
    res.cookie("shower", cookie);
    return res.send("Hi Twilio.");
  };

  setupUser = function(req, res, next){
    var cookie = req.cookies.shower, user;
    var sex    = req.body.Body.replace(/\s+/g, '');
    sex        = sex.toUpperCase();
    if (sex === "BOY"){
      twilio.sendMessage({
        to: req.body.From,
        from: OUR_NUMBER,
        body: "Alright man, you're ready to get your shower on. " +
              "Whenever you want to take a shower just text shower to me. Have fun!"
      });
      cookie.user.sex = "boy";
      user = cookie.user;
      console.log("Creating user", user);
      res.clearCookie("shower");
      return res.send("Hello");
    } else if (sex === "GIRL"){
      twilio.sendMessage({
        to: req.body.From,
        from: OUR_NUMBER,
        body: "Alright girl, you're ready to get your shower on. " +
              "Whenever you want to take a shower just text shower to me. Have fun!"
      });
      cookie.user.sex = "girl";
      user = cookie.user;
      console.log("Creating user", user);
      res.clearCookie("shower");
      return res.send("Hello");
    } else {
      twilio.sendMessage({
        to: req.body.From,
        from: OUR_NUMBER,
        body: "Sorry, I don't know those words. Please respond with either boy or girl."
      });
    }
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
