var tilelive = require("tilelive"),
    app = require("express")(),
    os = require('os'),
    path = require("path"),
    rw = require("rw"),
    yaml = require("js-yaml"),
    fs = require("fs");

var port = 5044,
    tilesLocation = path.resolve(__dirname, "tiles"),
    fontsLocation = path.resolve(__dirname, "fonts"),
    stylesLocation = path.resolve(__dirname, "styles"),
    // TODO(yuri): Multiple styles for a source?
    sourceStylesMap = {What: "exploring-style.tm2"};

// TODO(yuri): Implement tilecache?
require("mbtiles").registerProtocols(tilelive);
require("tilejson").registerProtocols(tilelive);
var Vector = require("tilelive-vector");
Vector.registerProtocols(tilelive);

Vector.mapnik.register_fonts(fontsLocation);

function list(filepath, callback) {
    filepath = path.resolve(filepath);
    fs.readdir(filepath, function(err, files) {
        if (err && err.code === 'ENOENT') return callback(null, {});
        if (err) return callback(err);
        for (var result = {}, i = 0; i < files.length; i++) {
            var name = files[i].match(/^([\w-]+)\.mbtiles$/);
            if (name) result[name[1]] = 'mbtiles://' + path.join(filepath, name[0]);
        }
        return callback(null, result);
    });
}

Vector.tm2z.list = list;
Vector.list = list;

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
                        console.log(endpointPrefix + "/:z/:x/:y@2x.png");
                        console.log(endpointPrefix + "/:z/:x/:y.png");
                        // NOTE(yuri): 2x should be above normal endpoint, because the regexp the route compiles to is greedy
                        app.get("/" + tileSet.name + "/:z/:x/:y@2x.png", function(req, res) { return getTile(tilestore, req.params.z, req.params.x, req.params.y, res); });
                        app.get("/" + tileSet.name + "/:z/:x/:y.png", function(req, res) { return getTile(tilestore, req.params.z, req.params.x, req.params.y, res); });
                    });
                });
            } else {
                // TODO(yuri): Test this with older geelong mbtiles
                tilelive.load(tileSet.location, function(err, tilestore) {
                    if(err) console.log(err);

                    console.log(endpointPrefix + "/:z/:x/:y.png");
                    app.get("/" + tileSet.name + "/:z/:x/:y.png", function(req, res) {
                      return getTile(tilestore, req.params.z, req.params.x, req.params.y, res);
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

function getTile(tilestore, z, x, y, res) {
  tilestore.getTile(z, x, y, function(err, tile, headers) {
    if (!err) {
      res.set(headers);
      return res.send(tile);
    } else {
      console.log(err);
      return res.status(404).send("Tile rendering error: " + err + "\n");
    }
  });
}
