  var tilelive = require("tilelive"),
    server = require("express")(),
    os = require('os'),
    port = 5044;

var mbtilesdirectory = "/usr/share/mapbox/export"; // relative or absolute directory containing .mbtiles files

// Make TileLive aware of the MBTiles and TileJSON tile formats.
require("mbtiles").registerProtocols(tilelive);
require("tilejson").registerProtocols(tilelive);

tilelive.list(mbtilesdirectory, function(err, tileinfo) {
  if (err) throw err;
  if (Object.getOwnPropertyNames(tileinfo).length == 0) {
    console.log("No mbtiles sets found in directory '" + mbtilesdirectory + "'.");
    process.exit(1);
  }    
  console.log("Serving these endpoints:");
  for (tileset in tileinfo) {
    tilelive.info(tileinfo[tileset], function(err, tilejson) {
      console.log("  http://" + os.hostname() + ":" + port + "/" + tilejson.id + ".json");
      // When client requests /mymbtiles.json, use TileJSON to return it.
      server.get("/" + tilejson.id + ".json", function(req, res) {
        tilejson.scheme = "xyz";
        tilejson.tiles = [ req.protocol + "://" + req.headers.host + "/" + tilejson.id + "/{z}/{x}/{y}.png" ];
        tilejson.grids = [ req.protocol + "://" + req.headers.host + "/" + tilejson.id + "/{z}/{x}/{y}.grid.json" ];

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

    // When client requests /mymbtiles/z/x/y.png, the MBTiles module serves the tile.
    tilelive.load(tileinfo[tileset], function(err, tilestore) {
      var tilestoreid = new RegExp(/\/([^/.]+).mbtiles/).exec(tilestore.filename)[1];
      console.log("  http://" + os.hostname() + ":" + port + "/" + tilestoreid + "/{z}/{x}/{y}.png");
      server.get("/" + tilestoreid + "/:z/:x/:y.png", function(req, res) {
        tilestore.getTile(req.param("z"), req.param("x"), req.param("y"), function(err, tile, headers) {
          if (!err) {
            res.send(tile);
          } else {
            res.send("Tile rendering error: " + err + "\n");
          }
        });
      });

      // When client requests /mymbtiles/z/xz/y.grid.json, MBTiles serves the UTFGrid (json).
      console.log("  http://" + os.hostname() + ":" + port + "/" + tilestoreid + "/{z}/{x}/{y}.grid.json");
      server.get("/" + tilestore.id + "/:z/:x/:y.grid.json", function(req, res) {
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

server.listen(port);
