var tilelive = require("tilelive"),
    app = require("express")(),
    os = require('os'),
    port = 5044,
    path = require("path"),
    rw = require("rw"),
    yaml = require("js-yaml");

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
    tilejson.scheme = "xyz";

    // console.log(tilejson);

    var xml = rw.readFileSync(path.join(process.cwd(), "geelong_roofs_style.tm2", "project.xml"), "utf8");
    var yml = yaml.safeLoad(rw.readFileSync(path.join(process.cwd(), "geelong_roofs_style.tm2", "project.yml"), "utf8"));
    console.log(yml);
    console.log(tilejson);

    tilejson.maxzoom = yml.maxzoom;
    tilejson.minzoom = yml.minzoom;
    tilejson.bounds = yml.bounds;
    tilejson.center = yml.center;
    tilejson.name = yml.name;
    tilejson.description = yml.description;
    var enableUTFGrid = yml.interactivity_layer !== '';

    if(enableUTFGrid) {
        tilejson.grids = [ "http://" + os.hostname() + ":" + port + "/" + tilesName + "/{z}/{x}/{y}.grid.json" ];
    }


    // TODO(yuri): Differentiate between vector tiles and normal mbtiles
    // NOTE(yuri): We create our own Backend and pass it to Vector, because by default
    // the Vector constructor uses the tiles listed in the xml ahead of any other source
    // you give it. So the tileset that's requested is the tm2source from Mapbox Studio,
    // whereas we want to serve mbtiles. Unless we want to use tilelive-tm2source.
    new Vector.Backend({
        uri: mbtiles,
    }, function(err, backend) {
        new Vector({
            xml: xml,
            backend: backend
        }, function(err, tilestore) {
            // console.log(tilestore);
            // TODO(yuri): Figure out a better way to express (pun intended) this path
            app.get("/" + tilesName + "/:z/:x/:y@?2?x?.png", function(req, res) {
                tilestore.getTile(req.params.z, req.params.x, req.params.y, function(err, tile, headers) {
                    console.log(arguments);
                    if (!err) {
                        res.set(headers);
                        return res.send(tile);
                    } else {
                        return res.status(404).send("Tile rendering error: " + err + "\n");
                    }
                });
            });

            if(enableUTFGrid) {
                app.get("/" + tilesName + "/:z/:x/:y.grid.json", function(req, res) {
                    tilestore.getGrid(req.params.z, req.params.x, req.params.y, function(err, grid, headers) {
                        console.log(arguments);
                        if (!err) {
                            res.header("Access-Control-Allow-Origin", "*");
                            res.header("Access-Control-Allow-Headers", "X-Requested-With");
                            return res.send(grid);
                        } else {
                            return res.status(404).send("Grid rendering error: " + err + "\n");
                        }
                    });
                });
            }
        });
    });

    app.get("/" + tilesName + ".json", function(req, res) {
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

app.listen(port);

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
