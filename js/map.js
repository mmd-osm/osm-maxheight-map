
var map;

//TODO: create settings instead
var _global_showLabel = false;
var _global_opacity = 0.7;   				// value range 0..1
var _global_maxheight = 4.0;
var _global_maxweight = 7.5;
var _global_classicStyle = false;
var _global_timeout = 20;
var _global_server = 'http://overpass-api.de/api/';
var _global_seg_x = undefined;
var _global_seg_y = undefined;

var epsg4326;
var epsg900913;

function initMap(div_id){
	
	epsg4326 = new OpenLayers.Projection("EPSG:4326");
	epsg900913 = new OpenLayers.Projection("EPSG:900913"); 


	(function() {

		var lang = getParam("lang");
		if (lang != "") {
			OpenLayers.Lang.setCode(lang);
		} else {
			OpenLayers.Lang.setCode("de");
			if (_global_languages != undefined && _global_languages.length > 0) {
				OpenLayers.Lang.setCode(_global_languages[0]["code"]);
			} else {
				OpenLayers.Lang.setCode("de");
			}
		}
		
		switch (getParam("label")) {

		case "T": _global_showLabel = true; break;
		case "F": _global_showLabel = false; break;
		default: _global_showLabel = false;

		}
		
		switch (getParam("style")) {
		
		case "point": _global_classicStyle = true; break;
		case "line": _global_classicStyle = false; break;
		default: _global_classicStyle = false;
		}

		var opacity = getParam("opacity");  // value range 0..100
		if (isNumber(opacity)) {
			opacity = Math.floor(opacity);
			if (opacity >= 0 && opacity <= 100)
				_global_opacity = opacity / 100;
		}
		
		var timeout = getParam("timeout");    // override timeout for expensive overpass api calls
		if (isNumber(timeout)) {
			timeout = Math.floor(timeout);
			if (timeout >= 1 && timeout <= 300)
				_global_timeout = timeout;
		}
		
		var server = getParam("server");
		if (isNumber(server)) {
			switch (server) {
			case "1": _global_server = 'http://overpass-api.de/api/'; break;
			case "2": _global_server = 'http://overpass.osm.rambler.ru/cgi/'; break;
			case "3": _global_server = 'http://api.openstreetmap.fr/oapi/'; break;
			case "9": _global_server = 'http://localhost/api/'; break;              //my test instance       
			default:  _global_server = 'http://overpass-api.de/api/';
			}
		}
		
		var seg_x = getParam("segx");
		if (isNumber(seg_x)) {
			seg_x = Math.floor(seg_x);
			if (seg_x >= 1 && seg_x <= 8)
				_global_seg_x = seg_x;			
		}
		
		var seg_y = getParam("segy");
		if (isNumber(seg_y)) {
			seg_y = Math.floor(seg_y);
			if (seg_y >= 1 && seg_y <= 8)
				_global_seg_y = seg_y;			
		}		

	})();
	
	$('#mystyle').buttonset();
	$('#mystyle').find('input')
	                .removeProp('checked')
	                    .filter('[value="' + (_global_classicStyle ? 'point' : 'line') + '"]')
	                    .prop('checked',true)
	                    .end()
	                .end()
	             .buttonset('refresh');
	
	$('[data-translate-text]').each(function() {
		$(this).text(OpenLayers.i18n($(this).data('translate-text')));
	});
	
	$('[data-translate-title]').each(function() {
		$(this).prop('title',OpenLayers.i18n($(this).data('translate-title')));
	});	
	
	$('[data-translate-button]').each(function() {
		$(this).button( "option", "label", OpenLayers.i18n($(this).data('translate-button')));
	});
	 	
	$('#search').prop('placeholder', OpenLayers.i18n('search'));
	$('#editjosmpotlatch').html(OpenLayers.i18n('editlinks'));	
	

	 			  	
	OpenLayers.ImgPath = "js/lib/OpenLayers/theme/dark/";


	map = new OpenLayers.Map("map", {
		div: div_id,
		projection : new OpenLayers.Projection("EPSG:3857"),
		displayProjection : new OpenLayers.Projection("EPSG:4326"),
		units : "m",
		resolutions : [ 156543.03390000001, 78271.516950000005,
		                39135.758475000002, 19567.879237500001, 9783.9396187500006,
		                4891.9698093750003, 2445.9849046875001, 1222.9924523437501,
		                611.49622617187504, 305.74811308593752, 152.87405654296876,
		                76.43702827148438, 38.21851413574219, 19.109257067871095,
		                9.5546285339355475, 4.7773142669677737, 2.3886571334838869,
		                1.1943285667419434, 0.59716428337097172, 0.29858214168548586 ],
		                maxResolution : 156543.0339,
		                maxExtent : new OpenLayers.Bounds(-20037508.34, -20037508.34,
		                		20037508.34, 20037508.34),
		                		controls : []
	} );

	// ----------------------------------------------------------------------------
	//	Map layers
	//----------------------------------------------------------------------------

	var osmLayer =  new OpenLayers.Layer.OSM("Mapnik", null, {
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
	});

	map.addLayer(osmLayer);

	map.addLayer(new OpenLayers.Layer.MapQuestOSM());

	map.addLayer (new OpenLayers.Layer.XYZ(OpenLayers.i18n("germanstyle"), 
			[ "http://a.tile.openstreetmap.de/tiles/osmde/${z}/${x}/${y}.png",
			  "http://b.tile.openstreetmap.de/tiles/osmde/${z}/${x}/${y}.png",
			  "http://c.tile.openstreetmap.de/tiles/osmde/${z}/${x}/${y}.png",
			  "http://d.tile.openstreetmap.de/tiles/osmde/${z}/${x}/${y}.png"],
			  {  numZoomLevels: 19, 
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, <a href="http://www.openstreetmap.de/germanstyle.html" target="_blank">About style</a>'}));

	map.addLayer (new OpenLayers.Layer.OSM("Cycle Map",
			[ 'http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png',
			  'http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png',
			  'http://a.tile.opencyclemap.org/cycle/${z}/${x}/${y}.png'],
			  {  transitionEffect : "resize",
		buffer           : 0,
		numZoomLevels    : 18,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, Tiles courtesy of <a href="http://www.opencyclemap.org/" target="_blank">Andy Allan</a>' }));

	map.addLayer(new OpenLayers.Layer.OSM.Toolserver('Hike &amp; Bike','hikebike'));
	map.addLayer(new OpenLayers.Layer.OSM.Toolserver('Mapnik B&amp;W','bw-mapnik'));
	map.addLayer(new OpenLayers.Layer.OSM.Toolserver('Mapnik no labels','osm-no-labels'));
	
	map.addLayer(new OpenLayers.Layer.TMS(
            "OSM Roads (New)",  // http://www.openmapsurfer.uni-hd.de/contact.html
            "http://129.206.74.245:8001/tms_r.ashx?",
            {
                type: 'png', 
                getURL: function(bounds) {
                    var res = this.map.getResolution();
                    var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
                    var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
                    var z = this.map.getZoom();
                    var limit = Math.pow(2, z);
                    
                    if (y < 0 || y >= limit) {
                        return OpenLayers.Util.getImagesLocation() + "404.png";
                    } else {
                        x = ((x % limit) + limit) % limit;
                        return this.url + "x=" + x + "&y=" + y + "&z=" + z;
                    }
                },
                displayOutsideMaxExtent: true,
                isBaseLayer: true,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OSM</a> contributors, ' +
                	         '<a href="http://www.openmapsurfer.uni-hd.de/contact.html" target="_blank">GIScience Uni HD</a>' 
            }
          ));

    var geolocate = new OpenLayers.Control.Geolocate({
        id: 'locate-control',
        geolocationOptions: {
            enableHighAccuracy: true,
            maximumAge: 15000,
            timeout: 7000
        }
    });
    
    var vector = new OpenLayers.Layer.Vector("Vector Layer", { displayInLayerSwitcher: false });

	var olMaxheightLayer = make_layer(_global_server, '[timeout:5];' + 
			'node(bbox)[maxheight][waterway!~"."]["waterway:sign"!~"."]["seamark:type"!~"."]["obstacle"!="bridge"];out;' + 
			'node(bbox)["maxheight:physical"~"."][waterway!~"."]["waterway:sign"!~"."]["seamark:type"!~"."]["obstacle"!~"bridge"];out;' + 
			'(way(bbox)[maxheight][highway];>;);out;' + 
			'(way(bbox)[maxheight][amenity=parking];>;);out;' +
			'(way(bbox)["maxheight:physical"][highway];>;);out;', 
			OpenLayers.i18n('maxheight'), getMaxheightStyleMap (), [featureFilterSimplifyLineString], false);

	olMaxheightLayer.setVisibility(false);

	var olCoveredLayer = make_layer(_global_server, '[timeout:5];' + 
			'(way(bbox)["covered"="yes"]["highway"~"^((primary|secondary|tertiary|trunk)(_link)?|service|residential|unclassified)$"][maxheight!~"."]["maxheight:physical"!~"."];>;);out;',
			OpenLayers.i18n('covered'), getSingleColorStyleMap ('red'), [featureFilterMaxheightIsSetOnNode,featureFilterSimplifyLineString], false);

	olCoveredLayer.setVisibility(false);


	var olTunnelLayer = make_layer(_global_server, '[timeout:5];' + 
			'(way(bbox)["tunnel"~"^(yes|building_passage)$"]["highway"~"^((primary|secondary|tertiary|trunk)(_link)?|service|residential|unclassified)$"][maxheight!~"."]["maxheight:physical"!~"."][man_made!~"adit"];>;);out;',
			OpenLayers.i18n('tunnel'), getSingleColorStyleMap ('red'), [featureFilterMaxheightIsSetOnNode,featureFilterSimplifyLineString], false);

	olTunnelLayer.setVisibility(false);
	
	var query_railwaylayer = '((way({{bbox}})["bridge"~"^(yes|viaduct)$"][railway];' +
	                         'way(around:0)["highway"~"^((primary|secondary|tertiary|trunk)(_link)?|service|residential|unclassified)$"]' +
	                         '[maxheight!~"."]["maxheight:physical"!~"."]["tunnel"!~"."]);>;);';

	var olRailwayLayer = make_large_layer(_global_server, query_railwaylayer,
			OpenLayers.i18n('railway'), getRailwayStyleMap (), [featureFilterIntersection,featureFilterSimplifyLineString], true, 11);

	olRailwayLayer.setVisibility(false);
	olRailwayLayer._suppress_setVisibility_during_init = true;


	var query_bridgelayer = '((way({{bbox}})[bridge~"^(yes|viaduct)$"][railway!~"."];way(around:0)' + 
    '[highway~"^((primary|secondary|tertiary|trunk)(_link)?|service|residential|unclassified)$"]' + 
    '[maxheight!~"."]["maxheight:physical"!~"."][tunnel!~"."]);>;);';

	var olBridgeLayer = make_large_layer(_global_server, query_bridgelayer,
			OpenLayers.i18n('waybelowbridge'), getMarkBridgeStyleMap(), [featureFilterIntersection,featureFilterSimplifyLineString], true, 11); 
	
	olBridgeLayer.setVisibility(false);
	olBridgeLayer._suppress_setVisibility_during_init = true;
	
	// combined bridge layer merges queries of the two layers olBridgeLayer + olRailwayLayer into one single query (performance)
	var query_combined_bridgelayer = '((way({{bbox}})[bridge~"^(yes|viaduct)$"];way(around:0)' + 
    '[highway~"^((primary|secondary|tertiary|trunk)(_link)?|service|residential|unclassified)$"]' + 
    '[maxheight!~"."]["maxheight:physical"!~"."][tunnel!~"."]);>;);';

	var olCombinedBridgeLayer = make_large_layer(_global_server, query_combined_bridgelayer,
			'(combined bridge layer)', getMarkCombinedBridgeStyleMap(), [featureFilterIntersection,featureFilterSimplifyLineString], true, 11); 

	olCombinedBridgeLayer.setVisibility(false);
	olCombinedBridgeLayer.displayInLayerSwitcher = false;
	olCombinedBridgeLayer._postprocess_setVisibility_during_init = true;
	
	
	// Ito hgv routing layer clone
	var olHGVLayer = make_layer(_global_server, '[timeout:5];' + 
			'(way(bbox)[highway][hgv];>;);out;' + 
			'(way(bbox)[highway][hazmat];>;);out;' +
			'(way(bbox)[highway]["hazmat:forward"];>;);out;' +
			'(way(bbox)[highway]["hazmat:backward"];>;);out;' +			
			'(way(bbox)[highway]["hazmat:water"];>;);out;', 
			OpenLayers.i18n('ito'), getHGVRoutingStyleMap (), [featureFilterSimplifyLineString], false);
	olHGVLayer.setVisibility(false);

	// Maxspeed for hgv
	var olHGVMaxspeedLayer = make_layer(_global_server, '[timeout:5];' + 
			'(way(bbox)[highway]["maxspeed:hgv"];>;);out;', 
			OpenLayers.i18n('maxspeedhgv'), getHGVMaxspeedStyleMap (), [featureFilterSimplifyLineString], false);
	olHGVMaxspeedLayer.setVisibility(false);

	// Maxweight
	var olMaxweightLayer = make_layer(_global_server, '[timeout:5];' + 
			'node(bbox)["maxweight"];out;' + 
			'(way(bbox)[highway]["maxweight"];>;);out;' +
			'(way(bbox)[highway]["maxweight:forward"];>;);out;' +
			'(way(bbox)[highway]["maxweight:backward"];>;);out;' +
			'(way(bbox)[amenity=parking]["maxweight"];>;);out;', 
			OpenLayers.i18n('maxweight'), getMaxweightStyleMap (), [featureFilterSimplifyLineString], false);

	olMaxweightLayer.setVisibility(false);

	// Maxaxleload
	var olMaxaxleloadLayer = make_layer(_global_server, '[timeout:5];' + 
			'node(bbox)[maxaxleload];out;' + 
			'(way(bbox)[highway][maxaxleload];>;);out;', 
			OpenLayers.i18n('maxaxleload'), getMaxaxleloadStyleMap (), [featureFilterSimplifyLineString], false);

	olMaxaxleloadLayer.setVisibility(false);

	// Maxwidth
	var olMaxwidthLayer = make_layer(_global_server, '[timeout:5];' + 
			'node(bbox)[maxwidth]["waterway:sign"!~"."]["seamark:type"!~"."]["obstacle"!~"bridge"]["river:waterway_distance"!~"."];out;' + 
			'(way(bbox)[highway][maxwidth];>;);out;' +
			'(way(bbox)[amenity=parking][maxwidth];>;);out;', 
			OpenLayers.i18n('maxwidth'), getMaxwidthStyleMap (), [featureFilterSimplifyLineString], false);

	olMaxwidthLayer.setVisibility(false);

	// Maxlength
	var olMaxlengthLayer = make_layer(_global_server, '[timeout:5];' + 
			'node(bbox)[maxlength];out;' + 
			'(way(bbox)[highway][maxlength];>;);out;' +
			'(way(bbox)[amenity=parking][maxlength];>;);out;', 
			OpenLayers.i18n('maxlength'), getMaxlengthStyleMap (), [featureFilterSimplifyLineString], false);

	olMaxlengthLayer.setVisibility(false);

	// Toll (toll, toll:n3, barrier=toll_booth)
	var olTollLayer = make_large_layer(_global_server, '[timeout:5];' + 
			'node(bbox)["barrier"="toll_booth"];out;' + 
			'(way(bbox)["barrier"="toll_booth"];>;);out;' + 
			'(way(bbox)[highway][toll];>;);out;' + 
			'(way(bbox)[highway]["toll:N3"];>;);out;' +
			'(way(bbox)[highway]["toll:n3"];>;);out;', 
			OpenLayers.i18n('toll'), getTollStyleMap (), [featureFilterSimplifyLineString], false, 8);

	olTollLayer.setVisibility(false);
	
	// Add waiting cursor for slow layers
	
	// Railway
	olRailwayLayer.events.register("loadstart", map, function() {
        $('html').addClass('busy');
        olRailwayLayer._loading = true;
     });
	
	olRailwayLayer.events.register("loadend", map, function() {
		if (!olBridgeLayer.visibility || !olBridgeLayer._loading)
          $('html').removeClass('busy');
        olRailwayLayer._loading = false;
     });
	
	// Bridge
	olBridgeLayer.events.register("loadstart", map, function() {
        $('html').addClass('busy');
        olBridgeLayer._loading = true;
     });
	
	olBridgeLayer.events.register("loadend", map, function() {
        if (!olRailwayLayer.visibility || !olRailwayLayer._loading)
        	$('html').removeClass('busy');
        olBridgeLayer._loading = false;
     });


	// Combined Railway + Bridge
	olCombinedBridgeLayer.events.register("loadstart", map, function() {
        $('html').addClass('busy');
        olCombinedBridgeLayer._loading = true;
     });	
	
	olCombinedBridgeLayer.events.register("loadend", map, function() {
       	$('html').removeClass('busy');             
        olCombinedBridgeLayer._loading = false;
     });

	// Deactivate all HTTP loading initially (reactivated in changelayer event handler)
	olRailwayLayer.strategies[0].deactivate();
	olBridgeLayer.strategies[0].deactivate();
	olCombinedBridgeLayer.strategies[0].deactivate();
		
	// Adding layers to map

	map.addLayers([olMaxheightLayer, olMaxwidthLayer, olMaxlengthLayer,
	               olMaxweightLayer, olMaxaxleloadLayer,
	               olHGVMaxspeedLayer,olHGVLayer, olTollLayer,
	               olCoveredLayer,olTunnelLayer,
	               olRailwayLayer,olBridgeLayer,olCombinedBridgeLayer]);
	
    map.addLayer(vector);	

	var olLayerSelect = new OpenLayers.Control.SelectFeature(
			[olMaxheightLayer,olHGVLayer, olHGVMaxspeedLayer, 
			 olMaxweightLayer, olMaxaxleloadLayer,
			 olMaxwidthLayer, olMaxlengthLayer, olTollLayer], 
			 {
				hover       : true,
				overFeature : function(	feature	) { 
					var status = [];
					var k;

					var keys = [ "maxheight", "maxheight:physical", "maxwidth",
					             "maxlength", "maxweight", "maxaxleload", "toll",
					             "hgv", "hazmat", "hazmat:water", "toll:N3",
					             "toll:n3", "maxspeed:hgv", "fee",
					             "mazmat:forward","hazmat:backward",
					             "maxweight:forward","maxweight:backward"];

					for (var i = 0; i < keys.length; i++) {
						k = keys[i];
						if (!(feature.attributes[k] == undefined)) 
							status.push(k + "=" + feature.attributes[k]);
					}

					var t = status.join(", ");
					setStatusText2 (t);
				},
				outFeature : function (feature) { setStatusText2 ( '' ); }
			 }
	);
	
    var permalink = new OpenLayers.Control.PermalinkCustom('permlink');

	map.addControls([new OpenLayers.Control.Navigation(),
//	                 new OpenLayers.Control.PanZoomBar({panIcons: false}),
	                 new OpenLayers.Control.Zoom(),
	                 new OpenLayers.Control.LayerSwitcher({
	                     div: document.getElementById("layerswitcher"),
	                     roundedCorner: false
	                 }),
	                 permalink,
	                 geolocate,
	                 new OpenLayers.Control.Attribution({div: document.getElementById("attribution")}),
	                 new OpenLayers.Control.ScaleLine({
	                     div: document.getElementById('scaleline'),
	                     geodesic: true,
	                     bottomInUnits: ""
	                 }),
	                 new OpenLayers.Control.MousePosition({
	                     div: document.getElementById("mousepos"),
	                     numDigits: 4
	                 }),
	                 new OpenLayers.Control.KeyboardDefaults(),
	                 olLayerSelect]);

	olLayerSelect.activate();

	
	map.events.register("movestart", map, function(evt) {
		 // kill running overpass api query for two slow layers
		if ((olRailwayLayer.visibility && olRailwayLayer._loading) || 
			(olBridgeLayer.visibility && olBridgeLayer._loading) ||
			(olCombinedBridgeLayer.visibility && olCombinedBridgeLayer._loading)) {
			killMyQueries([olRailwayLayer, olBridgeLayer, olCombinedBridgeLayer]);
			olRailwayLayer.removeAllFeatures({silent: false});
			olBridgeLayer.removeAllFeatures({silent: false});
			olCombinedBridgeLayer.removeAllFeatures({silent: false});
		}
		map.updateStatusLine();
	});
	
	
	map.events.register("zoomend", map, function(evt) {
		//avoid non-discrete zoom level (looks ugly)
		if (Math.round(map.zoom) != map.zoom)
			map.zoomTo(Math.round(map.zoom));
		/*
		 // kill running overpass api query for two slow layers
		if ((olRailwayLayer.visibility && olRailwayLayer._loading) || 
			(olBridgeLayer.visibility && olBridgeLayer._loading) ||
			(olCombinedBridgeLayer.visibility && olCombinedBridgeLayer._loading)) {
			killMyQueries([olRailwayLayer, olBridgeLayer, olCombinedBridgeLayer]);
			olRailwayLayer.removeAllFeatures({silent: false});
			olBridgeLayer.removeAllFeatures({silent: false});
			olCombinedBridgeLayer.removeAllFeatures({silent: false});
		}
		map.updateStatusLine();
		*/
	});	

	map.events.register("changelayer", map, function(evt) {
		map.updateStatusLine();
		updateLocation();
		map.baseLayer.setOpacity(_global_opacity);
		
		if (olMaxweightLayer.visibility  ||
			olMaxheightLayer.visibility) {
			$('#simulationwidget').show("blind",300);
		} else {
			$('#simulationwidget').hide("blind",300);
		}
		
		$("#export_gpx").button( olRailwayLayer.visibility ||
				                 olBridgeLayer.visibility || 
				                 olCombinedBridgeLayer.visibility ||
				                 olCoveredLayer.visibility ||
				                 olTunnelLayer.visibility				
				                 ? "enable" : "disable");
		
		if (olRailwayLayer.visibility && olBridgeLayer.visibility) {
			olCombinedBridgeLayer.setVisibility(true);
			olRailwayLayer.removeAllFeatures({silent: false});
			olBridgeLayer.removeAllFeatures({silent: false});			
			olRailwayLayer.strategies[0].deactivate();
			olBridgeLayer.strategies[0].deactivate();
			olCombinedBridgeLayer.strategies[0].activate();
		} 
		else {
			olCombinedBridgeLayer.setVisibility(false);
			olCombinedBridgeLayer.removeAllFeatures({silent: false});	
			olRailwayLayer.strategies[0].activate();
			olBridgeLayer.strategies[0].activate();
			olCombinedBridgeLayer.strategies[0].deactivate();
		}
 
	});

	map.events.register("moveend", map, function() {
		updateLocation();
	});

	map.events.register("touchend", map, function() {
		updateLocation();
	});	
	
	map.addControl (new OpenLayers.Control.Maplink(
			"josm",
			"http://127.0.0.1:8111/load_and_zoom",
			{label:"JOSM", target: "hiddenIframe", format: "trbl", id: "josm" }
	));
	
	map.addControl (new OpenLayers.Control.Maplink(
			"potlatch",
			"http://www.openstreetmap.org/edit?editor=potlatch2",
			{target: "_blank" }
		));	

	map.addControl (new OpenLayers.Control.Maplink(
			"ideditor",
			"http://www.openstreetmap.org/edit?editor=id",
			{target: "_blank" }
		));		
	
	var smartPopup = new SmartPopup(map);
	var smartPopupLayers = [olMaxheightLayer, olMaxwidthLayer, olMaxlengthLayer,
	                        olMaxweightLayer, olMaxaxleloadLayer,
	                        olHGVLayer,olHGVMaxspeedLayer, olTollLayer,
	                        olCoveredLayer,olTunnelLayer, 
	                        olRailwayLayer, olBridgeLayer, olCombinedBridgeLayer];
	
	for (var i=0; i<smartPopupLayers.length; i++) 
		smartPopup.addLayer(smartPopupLayers[i]);  

	var labelSwitch = new OpenLayers.Control ({

		id: 'labelSwitch',
		
		div: document.getElementById('labelSwitch'),
		
		allowSelection: true,

		draw:function(){

			OpenLayers.Control.prototype.draw.apply(this,arguments);
			if(!this.element){
												
				this.element = $('<div/>')
				        .html(OpenLayers.i18n("showlabel"))
				        .prop('title',OpenLayers.i18n("showlabeltitle"))
				        .addClass('labelSwitch blue')
						.button()
						.click(function(evt) {  
							_global_showLabel = !_global_showLabel;
							permalink.updateLink();
							var visibleLayers = window.map.getLayersBy("visibility", true);
							for (var i = 0; i < visibleLayers.length; i++) {
								var v = visibleLayers[i];
								if (v.features!=undefined)
									v.redraw();             // TODO: find something better to avoid reloading data
							}											
						});
				
				this.element.control=this;
				this.div.appendChild(this.element[0]);						

			}
			return this.div;
		}
	});

	map.addControl (labelSwitch);   


	if (!map.getCenter()) {

		var cookietext = readCookie('_osm_location');
		if (cookietext) {
			var cb = cookietext.split('|');
			var centre = lonLatToMercator( new OpenLayers.LonLat(cb[0], cb[1]));
			var zoom = cb[2];
			var layers = cb[3];
			layers = layers.substring(0,20); // support old cookie format   
			map.setCenter(centre, zoom);
			setMapLayers(layers);
		

		} else {
			var bounds_sample = undefined;
			var scenario = Math.floor(Math.random()*4);
						
			// Empty screens are boring, pick one out of 4 demo scenarios
			switch (scenario) {
			
			case 0: 		
				bounds_sample = new OpenLayers.Bounds( -1.9153118133544922,52.46680857125433,-1.8573760986328125,52.47656969731401); // Birmingham
				break;
			case 1:
				bounds_sample = new OpenLayers.Bounds(  13.365211486816406,52.49333767181167,13.481082916259766,52.53282722492755);  // Berlin
				break;
			case 2:
				bounds_sample = new OpenLayers.Bounds(  7.053565979003906,50.71108024481508,7.169437408447266,50.75215134593283);    // Bonn
				break;
			case 3:
				bounds_sample = new OpenLayers.Bounds(  6.946878433227539,50.922000764325134,6.986875534057617,50.94244824596977);   // Köln
				break;
					}
			
			map.zoomToExtent(bounds_sample.transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()));
			
			switch (scenario) {
			case 0:
				olCombinedBridgeLayer.visibility = true;
				break;
			case 1:
				olMaxheightLayer.setVisibility(true);
				break;
			case 2:
				olMaxheightLayer.setVisibility(true);	
				break;
			case 3:
				olCombinedBridgeLayer.visibility = true;
				break;
			}


			// Jump to geolocation if available
/*
			if (navigator.geolocation) {
				window.navigator.geolocation.getCurrentPosition(function(pos) {   
					var lonLat = new OpenLayers.LonLat(pos.coords.longitude, pos.coords.latitude)
					.transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
					map.setCenter(lonLat, 14);
				});
			}
*/			
		}
	} 
	
	if (olCombinedBridgeLayer.visibility == true) {
		olRailwayLayer.visibility = true;     // hack: avoid changelayer event
		olBridgeLayer.visibility = true;
		olCombinedBridgeLayer.visibility = false;			
		olCombinedBridgeLayer.setVisibility(true);
	}	
	
	map.baseLayer.setOpacity(_global_opacity);
	$('#maxheight_value').text((_global_maxheight).toFixed(2) + " m");
	$('#maxweight_value').text((_global_maxweight).toFixed(1) + " t");

	$("#slider").slider({
		min : 0,
		max : 1,
		step : 0.01,
		range: "min",
		value: _global_opacity,
		slide: function(event, ui) {
			 var value = Math.floor(0.8 * 255 + (1-ui.value) * 255 * 0.2);
			 var hex = value.toString(16);
			 if (hex.length == 1)
				 hex = "0" + hex;
			 $("#slider .ui-slider-range").css('background', '#'+hex+hex+hex);
		},
		change : function(event, ui) {
			_global_opacity = ui.value;
			permalink.updateLink();
			map.baseLayer.setOpacity(ui.value);
		}
	});
	
	$("#slider_maxheight").slider({
		min : 1,
		max : 4,
		step : 0.05,
		value: _global_maxheight,
		slide: function(event, ui) {
			$('#maxheight_value').text((ui.value).toFixed(2) + " m");
		},
		change : function(event, ui) {
			_global_maxheight = ui.value;
			$('#maxheight_value').text((ui.value).toFixed(2) + " m");
//			permalink.updateLink();
			olMaxheightLayer.redraw();
		}
	});

	$("#slider_maxweight").slider({
		min : 1,
		max : 30,
		step : 0.1,
		value: _global_maxweight,
		slide: function(event, ui) {
			$('#maxweight_value').text((ui.value).toFixed(1) + " t");
		},
		change : function(event, ui) {
			_global_maxweight = ui.value;
			$('#maxweight_value').text((ui.value).toFixed(1) + " t");
//			permalink.updateLink();
			olMaxweightLayer.redraw();
		}
	});
	
	geolocate.events.register("locationfailed", this, function(e) {
		vector.removeAllFeatures();		
		geolocate.deactivate();
	    $('#track').prop('checked', false);
	    $('#track').button("refresh");
		jqAlert(e.error.message, function() { /* do nothing */});
		return;
	});
	
	geolocate.events.register("locationuncapable", this, function(e) {
		vector.removeAllFeatures();		
		geolocate.deactivate();
	    $('#track').prop('checked', false);
	    $('#track').button("refresh");
		jqAlert(e.error.message, function() { /* do nothing */});
		return;
	});	

	geolocate.events.register("locationupdated", this, function(e) {
		var circlestyle = {
				fillOpacity: 0.1,
				fillColor: '#000',
				strokeColor: '#f00',
				strokeOpacity: 0.6
		};
		
		var crossstyle = {
				graphicName : 'cross',
				strokeColor : '#f00',
				strokeWidth : 1,
				fillOpacity : 0,
				pointRadius : 10
			};
		
		vector.removeAllFeatures();
		vector.addFeatures([
				new OpenLayers.Feature.Vector(e.point, {}, crossstyle),
				new OpenLayers.Feature.Vector(OpenLayers.Geometry.Polygon
						.createRegularPolygon(new OpenLayers.Geometry.Point(
								e.point.x, e.point.y),
								e.position.coords.accuracy / 2, 50, 0), {},
								circlestyle) ]);
		map.zoomToExtent(vector.getDataExtent());
	});	
	
	$('#locate').on('click', function(event) {
		vector.removeAllFeatures();
	    geolocate.deactivate();
	    $('#track').prop('checked', false);
	    $('#track').button("refresh");
	    geolocate.watch = false;
	    firstGeolocation = true;
	    geolocate.activate();
	});
	
	$('#track').on('click', function(event) {
	    vector.removeAllFeatures();
	    geolocate.deactivate();
	    if (this.checked) {
	        geolocate.watch = true;
	        firstGeolocation = true;
	        geolocate.activate();
	    }
	});
	
	$('#export_gpx').on('click', function(event) {
		exportGPX([olCoveredLayer, olTunnelLayer], [olRailwayLayer, olBridgeLayer, olCombinedBridgeLayer]);
	});
	
	$('#track').prop('checked', false);
	
	$('#mystyle').find('input').change(function(e) {
		switch ($(this).val()) {
		case "line":
			_global_classicStyle = false;
			olRailwayLayer.strategies[1].deactivate();
			olBridgeLayer.strategies[1].deactivate();
			olCombinedBridgeLayer.strategies[1].deactivate();
			break;
		case "point": 
			_global_classicStyle = true;
			olRailwayLayer.strategies[1].activate();
			olBridgeLayer.strategies[1].activate();
			olCombinedBridgeLayer.strategies[1].activate();
			break;
		}
		
		$('#mystyle').find('input')
		 				.removeProp('checked')
		 					.filter('[value="' + (_global_classicStyle ? 'point' : 'line') + '"]')
		 					.prop('checked',true)
		 					.end()
		 			    .end()
		 			 .buttonset('refresh');
		
		permalink.updateLink();
				
		olRailwayLayer.refresh({force:true});
		olBridgeLayer.refresh({force:true});
		olCombinedBridgeLayer.refresh({force:true});
		map.updateSize();		
		
	});
		
}

//var query_bridgelayer = '[timeout:' + _global_timeout + '];' + 
//'((way(bbox)["bridge"~"^(yes|viaduct)$"]["railway"!~"."];way(around:0)["highway"~"^((primary|secondary|tertiary|trunk)(_link)?|service|residential|unclassified)$"][maxheight!~"."]["maxheight:physical"!~"."]["tunnel"!~"."]);>;);out;' 

//var query_railwaylayer = '[timeout:' + _global_timeout + '];' + 
//'((way(bbox)["bridge"~"^(yes|viaduct)$"][railway];way(around:0)["highway"~"^((primary|secondary|tertiary|trunk)(_link)?|service|residential|unclassified)$"][maxheight!~"."]["maxheight:physical"!~"."]["tunnel"!~"."]);>;);out;'
