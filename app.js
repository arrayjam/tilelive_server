var tilelive = require("tilelive"),
    server = require("express")(),
    os = require('os'),
    port = 5044,
    application_prefix = ""; // Inserted at start of URL scheme, makes it easier to share to a port with other services. Blank or with trailing slash.

var mbtilesdirectory = "/usr/share/mapbox/export"; // relative or absolute directory containing .mbtiles files

// Make TileLive aware of the MBTiles and TileJSON tile formats.
require("mbtiles").registerProtocols(tilelive);
require("tilejson").registerProtocols(tilelive);

if (application_prefix !== "" && application_prefix[application_prefix.length - 1] !== "/") {
  console.log("Application Prefix must be empty or have a trailing slash: currently it is '" + application_prefix + "'.");
  process.exit(1);
}

tilelive.list(mbtilesdirectory, function(err, tileinfo) {
  if (err) throw err;

  var tilesets = toEntries(tileinfo);

  if (tilesets.length === 0) {
    console.log("No mbtiles sets found in directory '" + mbtilesdirectory + "'.");
    process.exit(1);
  }

  console.log("Found these tilesets:");
  tilesets.forEach(function(tileset) { console.log("  " + tileset.key + " - " + tileset.value); });
  console.log();

  console.log("Serving these endpoints:");
  tilesets.forEach(function(tileset) {
    var location = tileset.value,
        tileset_url = "/" + application_prefix + tileset.key,
        application_host = "http://" + os.hostname() + ":" + port + "/" + application_prefix;

    tilelive.info(location, function(err, tilejson) {
      console.log("  " + application_host + tilejson.id + ".json");

      // When client requests /mymbtiles.json, use TileJSON to return it.
      server.get("/" + application_prefix + tilejson.id + ".json", function(req, res) {
        tilejson.scheme = "xyz";
        tilejson.tiles = [ req.protocol + "://" + req.headers.host + "/" + application_prefix + tilejson.id + "/{z}/{x}/{y}.png" ];
        tilejson.grids = [ req.protocol + "://" + req.headers.host + "/" + application_prefix + tilejson.id + "/{z}/{x}/{y}.grid.json" ];

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
    tilelive.load(location, function(err, tilestore) {
      console.log("  " + application_host + tileset.key + "/{z}/{x}/{y}.png");
      server.get(tileset_url + "/:z/:x/:y.png", function(req, res) {
        tilestore.getTile(req.param("z"), req.param("x"), req.param("y"), function(err, tile) {

          if (!err) {
            res.contentType('image/png');
            res.send(tile);
          } else {
            res.send("Tile rendering error: " + err + "\n");
          }

        });
      });

      // When client requests /mymbtiles/z/xz/y.grid.json, MBTiles serves the UTFGrid (json).
      console.log("  " + application_host + tileset.key + "/{z}/{x}/{y}.grid.json");
      server.get(tileset_url + "/:z/:x/:y.grid.json", function(req, res) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");

        res.type("application/json");

        tilestore.getGrid(req.param("z"), req.param("x"), req.param("y"), function(err, tile) {
          if (!err) {
            res.send(tile);
          } else {
            res.send("Grid rendering error: " + err + "\n");
          }
        });
      });
    });
  });
});

server.listen(port);

function toEntries (map) {
  var entries = [];
  for (var key in map) entries.push({key: key, value: map[key]});
  return entries;
}
