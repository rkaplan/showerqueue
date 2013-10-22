(function(){
  "use strict";

  var routeList = {
    Root: require("./Root.js"),
    HandleText: require("./Text.js")
  };

  // arguments: mongo, conf
  var routes = [
    ["/",            routeList.Root,       1, 1, ["get"] ],
    ["/handle_text", routeList.HandleText, 1, 1, ["post"] ]
  ];

  exports.routes = routes;
}());
