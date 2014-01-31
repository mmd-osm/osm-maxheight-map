/**
 * Namespace: Util.OSM
 */
OpenLayers.Util.OSM = {};

/**
 * Constant: MISSING_TILE_URL
 * {String} URL of image to display for missing tiles
 */
OpenLayers.Util.OSM.MISSING_TILE_URL = "image/404.png";

OpenLayers.IMAGE_RELOAD_ATTEMPTS = 10; 
/**
 * Property: originalOnImageLoadError
 * {Function} Original onImageLoadError function.
 */
OpenLayers.Util.OSM.originalOnImageLoadError = OpenLayers.Util.onImageLoadError;

/**
 * Function: onImageLoadError
 */
OpenLayers.Util.onImageLoadError = function() {
    if (this.src.match(/^http:\/\/[abc]\.[a-z]+\.openstreetmap\.org\//)) {
        this.src = OpenLayers.Util.OSM.MISSING_TILE_URL;
    } else {
        OpenLayers.Util.OSM.originalOnImageLoadError;
    }
};

/**
 * Class: OpenLayers.Layer.OSM.Mapnik
 *
 * Inherits from:
 *  - <OpenLayers.Layer.OSM>
 */
OpenLayers.Layer.OSM.Mapnik = OpenLayers.Class(OpenLayers.Layer.OSM, {
    /**
     * Constructor: OpenLayers.Layer.OSM.Mapnik
     *
     * Parameters:
     * name - {String}
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, options) {
        var url = [
            "http://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
            "http://b.tile.openstreetmap.org/${z}/${x}/${y}.png",
            "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png"
        ];
        options = OpenLayers.Util.extend({ numZoomLevels: 19 }, options);
        var newArguments = [name, url, options];
        OpenLayers.Layer.OSM.prototype.initialize.apply(this, newArguments);
    },

    CLASS_NAME: "OpenLayers.Layer.OSM.Mapnik"
});

// create the custom layers
OpenLayers.Layer.OSM.Toolserver = OpenLayers.Class(OpenLayers.Layer.OSM, {
	
	initialize: function(name, tilename, options) {
		var url = [
			"http://a.www.toolserver.org/tiles/" + tilename + "/${z}/${x}/${y}.png", 
			"http://b.www.toolserver.org/tiles/" + tilename + "/${z}/${x}/${y}.png", 
			"http://c.www.toolserver.org/tiles/" + tilename + "/${z}/${x}/${y}.png"
		];
		
	options = OpenLayers.Util.extend(
            {  numZoomLevels: 19, 
               "tileOptions": {"crossOriginKeyword": null },
               attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }, options);
	OpenLayers.Layer.OSM.prototype.initialize.apply(this, [name, url, options]);
	},
					
	CLASS_NAME: "OpenLayers.Layer.OSM.Toolserver"
});


OpenLayers.Layer.MapQuestOSM = OpenLayers.Class(OpenLayers.Layer.XYZ, {
	name: "MapQuest Open",
	attribution: 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>, '
		+ '<a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and '
		+ '<a href="http://wiki.openstreetmap.org/wiki/Contributors" target="_blank">contributors</a>. '
		+ 'Data: <a href="http://wiki.openstreetmap.org/wiki/Open_Database_License" target="_blank">ODbL</a>, '
		+ 'Map: <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>',
	sphericalMercator: true,
	url: ' http://otile1.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.png',
	clone: function(obj) {
		if (obj == null) {
			obj = new OpenLayers.Layer.OSM(
					this.name, this.url, this.getOptions());
		}
		obj = OpenLayers.Layer.XYZ.prototype.clone.apply(this, [obj]);
		return obj;
	},
	CLASS_NAME: "OpenLayers.Layer.MapQuestOSM"
});


