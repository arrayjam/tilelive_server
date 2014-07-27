tilelive_server
===============
This is a very simple mbtiles server that replicates some functionality provided by the commercial MapBox hosting. This means you can use MapBox's javascript library, pointing at your own server. Three kinds of data about each mbtiles tileset are provided:

- `/mymbtiles.json`: returns a [TileJSON](https://github.com/mapbox/tilejson-spec) description of the tileset, including bounds, zoom levels etc.
- `/mymbtiles.grid.json`: returns a [UTFGrid](https://github.com/mapbox/utfgrid-spec) JSON description of the interactive layer of the tileset, if there is one.
- `/mymbtiles/[z]/[x]/[y].png`: returns the individual .png files.

## Installation

```
git clone https://github.com/arrayjam/tilelive_server.git
cd tilelive_server
npm install
```

## Configuration

Edit app.js and set:

- port
- mbtilesdirectory

## Run

`node app.js`

## Client-side code
In your HTML file, you will want `<script src='https://api.tiles.mapbox.com/mapbox.js/v1.6.4/mapbox.js'></script>`, then fetch the http://.../mymbtiles.json file, and pass it to mapbox like so:

```
var map = L.mapbox.map('map', tilejson);
```

## Notes
All mbtiles scanning and loading is done at start-up. Therefore you need to restart the server if new mbtiles files are added to the directory.

## Credits
Yuri Feldman: concept, code.
Steve Bennett: docs.
