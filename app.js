var tilelive = require("tilelive"),
    app = require("express")(),
    os = require('os'),
    path = require("path"),
    rw = require("rw"),
    yaml = require("js-yaml");

var port = 5044,
    tilesLocation = path.resolve(__dirname, "tiles"),
    fontsLocation = path.resolve(__dirname, "fonts"),
    stylesLocation = path.resolve(__dirname, "styles"),
    // TODO(yuri): Multiple styles for a source?
    sourceStylesMap = {Geelong: "Geelong_Roofs.tm2"};

// TODO(yuri): Implement tilecache
require("mbtiles").registerProtocols(tilelive);
require("tilejson").registerProtocols(tilelive);
var Vector = require("tilelive-vector");
Vector.registerProtocols(tilelive);

Vector.mapnik.register_fonts(fontsLocation);

tilelive.list(tilesLocation, function(err, tileSetMap) {
    if(err) console.log(err);

    var tileSets = tileSetEntries(tileSetMap);

    tileSets.forEach(function(tileSet) {
        var endpointPrefix = "http://" + os.hostname() + ":" + port + "/" + tileSet.name;
        tilelive.info(tileSet.location, function(err, tilejson) {
            if(err) console.log(err);

            var vectorTiles = (("vector_layers" in tilejson) &&
                                  (tilejson.format === "pbf"));

            var enableUTFGrid;
            if(vectorTiles) {
                var sourceStylesFolder = path.join(stylesLocation, sourceStylesMap[tileSet.name]);
                var xml = rw.readFileSync(path.join(sourceStylesFolder, "project.xml"), "utf8");
                var yml = yaml.safeLoad(rw.readFileSync(path.join(sourceStylesFolder, "project.yml"), "utf8"));
                tilejson.maxzoom = yml.maxzoom;
                tilejson.minzoom = yml.minzoom;
                tilejson.bounds = yml.bounds;
                tilejson.center = yml.center;
                tilejson.name = yml.name;
                tilejson.description = yml.description;

                enableUTFGrid = yml.interactivity_layer !== '';

                // NOTE(yuri): we create our own backend and pass it to Vector, because by default
                // the Vector constructor uses the tiles listed in the xml ahead of any other source
                // you give it. So the tileset that's requested is the tm2source from Mapbox Studio,
                // whereas we want to serve mbtiles. Unless we want to use tilelive-tm2source.
                new Vector.Backend({
                    uri: tileSet.location,
                }, function(err, backend) {
                    new Vector({
                        xml: xml,
                        backend: backend
                    }, function(err, tilestore) {
                        console.log(endpointPrefix + "/:z/:x/:y.png");
                        // TODO(yuri): Register alternate @2x path
                        app.get("/" + tileSet.name + "/:z/:x/:y.png", function(req, res) {
                            tilestore.getTile(req.params.z, req.params.x, req.params.y, function(err, tile, headers) {
                                if(headers['Last-Modified'] === 'Thu, 01 Jan 1970 00:00:00 GMT') {
                                    // console.log("wat", arguments);
                                    console.log(tile.toString("hex"));
                                }
                                if (!err) {
                                    res.set(headers);
                                    return res.send(tile);
                                } else {
                                    return res.status(404).send("Tile rendering error: " + err + "\n");
                                }
                            });
                        });
                    });
                });
            } else {
                // TODO(yuri): Test this with older geelong mbtiles
                tilelive.load(tileSet.location, function(err, tilestore) {
                    if(err) console.log(err);

                    console.log(endpointPrefix + "/:z/:x/:y.png");
                    app.get("/" + tileSet.name + "/:z/:x/:y.png", function(req, res) {
                        tilestore.getTile(req.params.z, req.params.x, req.params.y, function(err, tile, headers) {
                            if (!err) {
                                res.set(headers);
                                res.send(tile);
                            } else {
                                res.status(404).send("Tile rendering error: " + err + "\n");
                            }

                        });
                    });
                });
            }

            tilejson.tiles = [ endpointPrefix + "/{z}/{x}/{y}.png" ];
            tilejson.scheme = "xyz";

            if(enableUTFGrid) {
                // TODO(yuri): Test this with older geelong mbtiles
                tilejson.grids = [ endpointPrefix + "/{z}/{x}/{y}.grid.json" ];
            }

            console.log(endpointPrefix + ".json");
            app.get("/" + tileSet.name + ".json", function(req, res) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "X-Requested-With");
                return res.json(tilejson);
            });
        });
    });
});

app.listen(port);

function tileSetEntries(map) {
  var entries = [];
  for (var key in map) entries.push({name: key, location: map[key]});
  return entries;
}
