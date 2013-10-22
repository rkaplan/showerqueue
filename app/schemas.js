(function(){
  "use strict";

  var mongoose = require("mongoose"),
    Schema   = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

  var User = new Schema({
    name: String,
    phoneNumber: String,
    dorm: String,
    floor: String,
    sex: String,
    showerQueue: ObjectId
  });

  var ShowerQueue = new Schema({
    queue: [ObjectId],
    dorm: String,
    floor: String,
    sex: String,
    capacity: Number
  });

  exports.User        = mongoose.model("User", User);
  exports.ShowerQueue = mongoose.model("ShowerQueue", ShowerQueue);

})();