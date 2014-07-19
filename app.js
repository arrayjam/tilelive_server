var tilelive = require("tilelive"),
    server = require("express")(),
    port = 8788;

require("mbtiles").registerProtocols(tilelive);
require("tilejson").registerProtocols(tilelive);

tilelive.list("tiles", function(err, tileinfo) {
  if (err) throw err;

  console.log(tileinfo);

  for (tileset in tileinfo) {
    tilelive.info(tileinfo[tileset], function(err, tilejson) {
      server.get("/" + tileset + ".json", function(req, res) {
        tilejson.scheme = "xyz";
        tilejson.tiles = [ req.protocol + "://" + req.headers.host + "/" + tileset + "/{z}/{x}/{y}.png" ];
        tilejson.grids = [ req.protocol + "://" + req.headers.host + "/" + tileset + "/{z}/{x}/{y}.grid.json" ];

        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.type("application/json");
        if (!err) {
          res.send(tilejson);
        } else {
          res.send("TileJSON error: " + err + "\n");
        }
      });
    });

    tilelive.load(tileinfo[tileset], function(err, tilestore) {
      server.get("/" + tileset + "/:z/:x/:y.png", function(req, res) {
        tilestore.getTile(req.param("z"), req.param("x"), req.param("y"), function(err, tile, headers) {
          if (!err) {
            res.send(tile);
          } else {
            res.send("Tile rendering error: " + err + "\n");
          }
        });
      });

      server.get("/" + tileset + "/:z/:x/:y.grid.json", function(req, res) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.type("application/json");
        tilestore.getGrid(req.param("z"), req.param("x"), req.param("y"), function(err, tile, headers) {
          if (!err) {
            res.send(tile);
          } else {
            res.send("Grid rendering error: " + err + "\n");
          }
        });
      });
    });
  }
});

console.log("Listening on port " + port);
server.listen(port);
