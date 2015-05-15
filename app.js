var tilelive = require("tilelive"),
    server = require("express")(),
    os = require('os'),
    port = 5044,
    path = require("path"),
    fs = require("fs");

// TODO(yuri): Implement tilecache
require("mbtiles").registerProtocols(tilelive);
require("tilejson").registerProtocols(tilelive);
var Vector = require("tilelive-vector");
Vector.registerProtocols(tilelive);

Vector.mapnik.register_fonts(path.resolve(__dirname, 'fonts'));
console.log(Vector.mapnik.fonts());

// TODO(yuri): Drive this through a config
// TODO(yuri): Use tilelive.list to generate a list of entries for initial config.
// Is tilelive-vector's list broken? Do we need to fix/monkey patch it?
var mbtiles = "mbtiles:///Users/arrayjam/code/tilelive_server/tiles/Geelong.mbtiles",
    tilesName = "Geelong";

tilelive.info(mbtiles, function(err, tilejson) {
    tilejson.tiles = [ "http://" + os.hostname() + ":" + port + "/" + tilesName + "/{z}/{x}/{y}.png" ];
    // TODO(yuri): UTFGrid
    tilejson.scheme = "xyz";
    // TODO(yuri): Why is minzoom/maxzoom not being filled out properly?
    // It's determined by source, not the style
    tilejson.maxzoom = 18;
    console.log(tilejson);


    var tm2Path = path.join(process.cwd(), "geelong_roofs_style.tm2", "project.xml");
    // TODO(yuri): Differentiate between vector tiles and normal mbtiles
    fs.readFile(tm2Path, 'utf8', function(err, xml) {
        // TODO(yuri): Is it really necessary to construct our own Backend here?
        // Can we use a different constructor for Vector?
        new Vector.Backend({
            uri: mbtiles,
        }, function(err, backend) {
            // console.log("backend", backend);
            new Vector({
                xml: xml,
                backend: backend
            }, function(err, tilestore) {
                // console.log(tilestore._map.fonts());
                // tilestore.getTile();
                // TODO(yuri): Handle both normal DPI and @2x
                server.get("/" + tilesName + "/:z/:x/:y.png", function(req, res) {
                    tilestore.getTile(req.params.z, req.params.x, req.params.y, function(err, tile, headers) {
                        console.log(arguments);
                        if (!err) {
                            res.set(headers);
                            res.send(tile);
                        } else {
                            res.status(404).send("Tile rendering error: " + err + "\n");
                        }

                    });
                });
            });
        });
    });

    server.get("/" + tilesName + ".json", function(req, res) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        return res.json(tilejson);
    });


    // Vector.xray({uri: mbtiles}, function(err, tilestore) {
    //     server.get("/" + tilesName + "/:z/:x/:y.png", function(req, res) {
    //         tilestore.getTile(req.params.z, req.params.x, req.params.y, function(err, tile, headers) {
    //             console.log(arguments);
    //             if (!err) {
    //                 res.set(headers);
    //                 res.send(tile);
    //             } else {
    //                 res.status(404).send("Tile rendering error: " + err + "\n");
    //             }

    //         });
    //     });
    // });

    // var tm2Path = path.join(process.cwd(), "geelong_roofs_style.tm2", "project.xml");
    // fs.readFile(tm2Path, 'utf8', function(err, xml) {
    //     console.log(xml);
    //     new Vector({
    //         xml:xml,
    //         base:path.dirname(tm2Path.pathname),
    //         source: mbtiles
    //     }, function(err, tilestore) {
    //         server.get("/" + tilesName + "/:z/:x/:y.png", function(req, res) {
    //             tilestore.getTile(req.params.z, req.params.x, req.params.y, function(err, tile, headers) {
    //                 console.log(arguments);
    //                 if (!err) {
    //                     res.set(headers);
    //                     res.send(tile);
    //                 } else {
    //                     res.status(404).send("Tile rendering error: " + err + "\n");
    //                 }

    //             });
    //         });
    //     });
    // });

    // console.log(tm2Path);
    // Vector({xml: tm2Path, source: mbtiles}, function() {
    //     console.log(arguments);
    // });
    // tilelive.load(mbtiles, function(err, tilestore) {
    //     // console.log(arguments);

    //     console.log("  " + "/" + tilesName + "/{z}/{x}/{y}.png");
    //     server.get("/" + tilesName + "/:z/:x/:y.png", function(req, res) {
    //         tilestore.getTile(req.params.z, req.params.x, req.params.y, function(err, tile, headers) {
    //             if (!err) {
    //                 res.set(headers);
    //                 res.send(tile);
    //             } else {
    //                 res.status(404).send("Tile rendering error: " + err + "\n");
    //             }

    //         });
    //     });
    // });
});

server.listen(port);

// if (applicationPrefix !== "" && applicationPrefix[applicationPrefix.length - 1] !== "/") {
//   console.log("Application Prefix must be empty or have a trailing slash: currently it is '" + applicationPrefix + "'.");
//   process.exit(1);
// }

// tilelive.list(mbtilesdirectory, function(err, tileinfo) {
//   if (err) throw err;

//   console.log(tileinfo);

//   var tilesets = toEntries(tileinfo);

//   if (tilesets.length === 0) {
//     console.log("No mbtiles sets found in directory '" + mbtilesdirectory + "'.");
//     process.exit(1);
//   }

//   console.log("Found these tilesets:");
//   tilesets.forEach(function(tileset) { console.log("  " + tileset.key + " - " + tileset.value); });
//   console.log();

//   console.log("Serving these endpoints:");
//   tilesets.forEach(function(tileset) {
//     var location = tileset.value,
//         tilesetUrl = "/" + applicationPrefix + tileset.key,
//         applicationHost = "http://" + os.hostname() + ":" + port + "/" + applicationPrefix;

//     tilelive.info(location, function(err, tilejson) {
//       // happens with defective exports
//       if (!tilejson) {
//           console.log("  Tilejson at " + location + " is defective");
//           return;
//       }

//       console.log("  " + applicationHost + tilejson.id + ".json");

//       // When client requests /mymbtiles.json, use TileJSON to return it.
//       server.get("/" + applicationPrefix + tilejson.id + ".json", function(req, res) {
//         tilejson.scheme = "xyz";
//         tilejson.tiles = [ req.protocol + "://" + req.headers.host + "/" + applicationPrefix + tilejson.id + "/{z}/{x}/{y}.pbf" ];
//         tilejson.grids = [ req.protocol + "://" + req.headers.host + "/" + applicationPrefix + tilejson.id + "/{z}/{x}/{y}.grid.json" ];

//         res.header("Access-Control-Allow-Origin", "*");
//         res.header("Access-Control-Allow-Headers", "X-Requested-With");
//         res.type("application/json");

//         if (!err) {
//           res.send(tilejson);
//         } else {
//           res.status(404).send("TileJSON error: " + err + "\n");
//         }

//       });
//     });

//     // // When client requests /mymbtiles/z/x/y.png, the MBTiles module serves the tile.
//     // tilelive.load(location, function(err, tilestore) {
//     //   console.log("  " + applicationHost + tileset.key + "/{z}/{x}/{y}.png");
//     //   server.get(tilesetUrl + "/:z/:x/:y.png", function(req, res) {
//     //     tilestore.getTile(req.params.z, req.params.x, req.params.y, function(err, tile, headers) {

//     //       if (!err) {
//     //         res.set(headers);
//     //         res.send(tile);
//     //       } else {
//     //         res.status(404).send("Tile rendering error: " + err + "\n");
//     //       }

//     //     });
//     //   });

//     // When client requests /mymbtiles/z/x/y.png, the MBTiles module serves the tile.
//     tilelive.load(location, function(err, tilestore) {
//       console.log("  " + applicationHost + tileset.key + "/{z}/{x}/{y}.pbf");
//       server.get(tilesetUrl + "/:z/:x/:y.pbf", function(req, res) {
//         tilestore.getTile(req.params.z, req.params.x, req.params.y, function(err, tile, headers) {

//           if (!err) {
//             res.set(headers);
//             res.send(tile);
//           } else {
//             res.status(404).send("Tile rendering error: " + err + "\n");
//           }

//         });
//       });

//       // When client requests /mymbtiles/z/xz/y.grid.json, MBTiles serves the UTFGrid (json).
//       console.log("  " + applicationHost + tileset.key + "/{z}/{x}/{y}.grid.json");
//       server.get(tilesetUrl + "/:z/:x/:y.grid.json", function(req, res) {
//         res.header("Access-Control-Allow-Origin", "*");
//         res.header("Access-Control-Allow-Headers", "X-Requested-With");

//         res.type("application/json");

//         tilestore.getGrid(req.params.z, req.params.x, req.params.y, function(err, tile) {
//           if (!err) {
//             res.send(tile);
//           } else {
//             res.status(404).send("Grid rendering error: " + err + "\n");
//           }
//         });
//       });
//     });
//   });
// });


// function toEntries (map) {
//   var entries = [];
//   for (var key in map) entries.push({key: key, value: map[key]});
//   return entries;
// }
