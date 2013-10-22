(function(){
  "use strict";

  var _     = require("underscore"),
      async = require("async"),

      getUserName,
      getUserAndShowerQueue;

  module.exports = function(schemas) {
    this.schemas = schemas;

    // check if a user exists in the database with number phoneNumber
    this.numberExists = function(number, callback) {
      this.schemas.User.findOne({ phoneNumber: number }, function(err, user) {
        if (err) {
          return callback(err);
        }
        if (!user) {
          return callback(null, false);
        }
        else {
          return callback(null, true);
        }
      });
    };

    // create a user object in the database
    this.createUser = function(name, number, dorm, floor, sex, callback) {
      var self = this;
      console.log("Creating user", dorm, floor, sex);
      this.schemas.ShowerQueue.findOne({
        dorm: dorm,
        floor: floor,
        sex: sex
      }, function(err, showerQueue) {
        if (err || !showerQueue) {
          return callback(err || {msg: "No such queue"});
        }

        var user = new self.schemas.User({
          name: name,
          phoneNumber: number,
          dorm: dorm,
          floor: floor,
          sex: sex,
          showerQueue: showerQueue._id
        });

        user.save(callback);
      });
    }

    // put the user in line for a shower
    this.enqueueUser = function(userNumber, callback) {
      getUserAndShowerQueue(this.schemas, userNumber, function(err, user, showerQueue) {
        if (err) {
          return callback(err);
        }

        showerQueue.queue.push(user._id);
        showerQueue.markModified("queue");
        showerQueue.save();

        return callback(null, {
          queuePos: showerQueue.queue.length(),
          capacity: showerQueue.capacity
        });
      })
    }

    // remove the user from the shower queue (called when the user is done with their shower)
    // and pass the user who's up next for showering to the callback
    this.dequeueUser = function(userNumber, callback) {
      var self = this;
      getUserAndShowerQueue(this.schemas, userNumber, function(err, user, showerQueue) {
        if (err) {
          return callback(err);
        }
        
        var userIndex = showerQueue.queue.indexOf(user._id, 1);
        if (userIndex == -1) {
          return callback({
            msg: "Error: user " + user._id + " is not currently in the shower queue."
          })
        }

        showerQueue.queue.splice(userIndex, 1); // remove the user from the queue
        showerQueue.markModified("queue");
        showerQueue.save();

        if (showerQueue.queue.length() >= showerQueue.capacity) { // someone who was waiting can now shower
          var nextUserId = showerQueue.queue[showerQueue.capacity - 1];
          self.schemas.User.findOne({ _id: nextUserId }, function(err, user) {
            if (err || !user) {
              return callback(err)
            }
            return callback(null, user);
          })
        }
        else {
          return callback(null);
        }
      });
    }

    // get the names of everyone in the same ShowerQueue as the user with phone number userNumber
    this.getNamesInShowerQueue = function(userNumber, callback) {
      getUserAndShowerQueue(this.schemas, userNumber, function(err, user, showerQueue) {
        if (err) {
          return callback(err);
        }

        var parallel_arr = [];
        for (var i = 0; i < showerQueue.length; i++){
          parallel_arr.push(getUserName(this.schemas, showerQueue[i]));
        }
        async.parallel(parallel_arr, callback);
      });
    }
  } 
  
  // returns a function that will get the user's name from their object id
  getUserName = function(schemas, id){
    return function(callback){
      schemas.User.findOne({_id: id}, function(err, user){
        if (err || !user){
          return callback({msg: "Error: no user found."});
        }
        return callback(null, user.name);
      });
    }
  };

  // call callback with parameters user and showerQueue
  getUserAndShowerQueue = function(schemas, userNumber, callback) {
    schemas.User.findOne({
        number: userNumber
      }, function(err, user) {
        if (err || !user) {
          return callback(err);
        }

        schemas.ShowerQueue.findOne({
          _id: user.showerQueue
        }, function(err, showerQueue) {
          if (err || !showerQueue) {
            return callback(err);
          }

          return callback(null, user, showerQueue);
        });
      });
  }

})();
