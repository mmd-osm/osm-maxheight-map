

function mercatorToLonLat(merc) {
  var lon = (merc.lon / 20037508.34) * 180;
  var lat = (merc.lat / 20037508.34) * 180;
  
  lat = 180/Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
  
  return new OpenLayers.LonLat(lon, lat);
}

function lonLatToMercator(ll) {
  var lon = ll.lon * 20037508.34 / 180;
  var lat = Math.log(Math.tan((90 + ll.lat) * Math.PI / 360)) / (Math.PI / 180);
  
  lat = lat * 20037508.34 / 180;
  
  return new OpenLayers.LonLat(lon, lat);
}

function scaleToZoom(scale) {
  return Math.log(360.0/(scale * 512.0)) / Math.log(2.0);
}

function updateLocation() {
  var lonlat = map.getCenter().clone().transform(map.getProjectionObject(), epsg4326);
  var zoom = map.getZoom();
  var layers = getMapLayers();
  var extents = map.getExtent().clone().transform(map.getProjectionObject(), epsg4326);

  var expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 1);

  try {
    document.cookie = "_osm_location=" + lonlat.lon + "|" + lonlat.lat + "|" + zoom + "|" + layers + "; path=/; expires=" + expiry.toGMTString();
  } catch (e) {
	  // ignore
  }
}

function getMapLayers() {
	var layerConfig = "";

	for ( var layers = map.getLayersBy("isBaseLayer", true), i = 0; i < layers.length; i++) {
		if (layers[i].displayInLayerSwitcher == true)
			layerConfig += layers[i] == map.baseLayer ? "B" : "0";
	}

	for ( var layers = map.getLayersBy("isBaseLayer", false), i = 0; i < layers.length; i++) {
		if (layers[i].displayInLayerSwitcher == true)
			layerConfig += layers[i].getVisibility() ? "T" : "F";
	}

	return layerConfig;
}

function setMapExtent(extent) {
  map.zoomToExtent(extent.clone().transform(epsg4326, map.getProjectionObject()));
}

function setMapLayers(layerConfig) {
	var l = 0;
	var mapLayersInLayerSwitcher = 0;
	var layerMapping = {};

	for ( var i = 0, len = this.map.layers.length; i < len; i++) {
		if (this.map.layers[i].displayInLayerSwitcher == true) {
			layerMapping[mapLayersInLayerSwitcher++] = i;
		}
	}

	for ( var layers = map.getLayersBy("isBaseLayer", true), i = 0; i < layers.length; i++) {
		var layer = layers[layerMapping[i]];
		if (layer.displayInLayerSwitcher == true) {
			var c = layerConfig.charAt(l++);
			if (c == "B") {
				map.setBaseLayer(layer);
			}
		}
	}

	while (layerConfig.charAt(l) == "B" || layerConfig.charAt(l) == "0") {
		l++;
	}

	for ( var layers = map.getLayersBy("isBaseLayer", false), i = 0; i < layers.length; i++) {

		var layer = layers[layerMapping[i]];

		if (layer.displayInLayerSwitcher == true) {
			var c = layerConfig.charAt(l++);

			if (layer._suppress_setVisibility_during_init == true) {
				if (c == "T") {
					layer.visibility = true;
				} else if (c == "F") {
					layer.visibility = false;
				}
			} else {
				if (c == "T") {
					layer.setVisibility(true);
				} else if (c == "F") {
					layer.setVisibility(false);
				}
			}
		}
	}

	adjustCombinedLayerVisibility();  
}

function readCookie(name) {
  var nameEQ = name + "=";
                                        
  try {
	  var ca = document.cookie.split(';');
	  for(var i=0;i < ca.length;i++) {
	    var c = ca[i];
	    while (c.charAt(0)==' ') c = c.substring(1,c.length);
	    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	  } 
  } catch (e) {
	  return null;
  }

  return null;
}
