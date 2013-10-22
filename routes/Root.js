(function(){
  "use strict";
  var _ = require("underscore"),

      dispatch, handler,
      handleGet;

  handleGet = function(req, res, next){
    var params = {
      title: "The Shower Queue"
    };
    return res.render("index.jade", params);
  };

  dispatch = {GET: handleGet};
  handler = function(req, res, next){
    if (_.has(dispatch, req.method)){
      dispatch[req.method](req, res, next);
    }
  };

  module.exports = handler;
}());
