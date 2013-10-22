(function(){
  "use strict";
  var _          = require("underscore"),
      Controller = require("../app/controller.js"),
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
    var controller = new Controller(req._schemas);

    var number = req.body.From;
    controller.numberExists(number, function(err, isUser){
      if (isUser){
        var body = req.body.Body.replace(/\s+/g, '');
        body     = body.toUpperCase();
        if (body === "SHOWER"){
          controller.enqueueUser(number, function(err, data){
            if (err){
              return next(err);
            }
            var message = "Awesome! You are #" + (data.queuePos - data.capacity) +
                          " in line. I'll let you know when a shower is ready.";
            if (data.queuePos <= data.capacity){
              message = "It's your lucky day! There's an open shower, and it's all yours now. Have fun!" +
                        " Please remember to text me done when you're done, so I can keep the line moving.";
            }
            twilio.sendMessage({
              to: number,
              from: OUR_NUMBER,
              body: message
            });
          });
        } else if (body === "DONE"){
          controller.dequeueUser(number, function(err, nextUser){
            if (err){
              return next(err);
            }
            twilio.sendMessage({
              to: number,
              from: OUR_NUMBER,
              body: "Thanks. Have a nice day!"
            });
            if (nextUser){
              // somebody else can now shower
              twilio.sendMessage({
                to: nextUser.phoneNumber,
                from: OUR_NUMBER,
                body: "Good news! It's your turn to shower! Please remember to text me 'done' when you're done, so I can keep the line moving."
              });
            }
          });
        } else {
          twilio.sendMessage({
            to: number,
            from: OUR_NUMBER,
            body: "Sorry. One of our programmers is lazy, and I only understand two words. Please send me 'shower' to sign up for a shower, or 'done' if you're done with your shower"
          });
        }
      } else {
        return createUser(req, res, next);
      }
    });
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
    var controller = new Controller(req._schemas);
    var cookie     = req.cookies.shower, user;
    var sex        = req.body.Body.replace(/\s+/g, '');
    sex            = sex.toUpperCase();
    if (sex === "BOY"){
      twilio.sendMessage({
        to: req.body.From,
        from: OUR_NUMBER,
        body: "Alright man, you're ready to get your shower on. " +
              "Whenever you want to take a shower just text shower to me. Have fun!"
      });
      cookie.user.sex = "boy";
      user = cookie.user;
      controller.createUser(user.name, req.body.From, user.dorm, user.floor, user.sex, function(err, user){
        res.clearCookie("shower");
        return res.send("Hello");
      });
    } else if (sex === "GIRL"){
      twilio.sendMessage({
        to: req.body.From,
        from: OUR_NUMBER,
        body: "Alright girl, you're ready to get your shower on. " +
              "Whenever you want to take a shower just text shower to me. Have fun!"
      });
      cookie.user.sex = "girl";
      user = cookie.user;
      controller.createUser(user.name, req.body.From, user.dorm, user.floor, user.sex, function(err, user){
        res.clearCookie("shower");
        return res.send("Hello");
      });
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
