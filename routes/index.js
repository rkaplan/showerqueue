(function(){
  "use strict";

  var routeList = {
    Root: require("./Root.js")
  };

  // arguments: mongo, conf
  var routes = [
    ["/", routeList.Root, 1, 1, ["get"] ]
  ];

  exports.routes = routes;
}());
