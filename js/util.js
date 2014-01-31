function getParam(sname) {
	var params = location.search.substr(location.search.indexOf("?")+1);
	var sval = "";
	params = params.split("&"); 

	for (var i = 0; i < params.length; i++) {
		var temp = params[i].split("=");
		if ( [temp[0]] == sname ) {
			sval = temp[1];
		}
	}
	return sval;
}

function getUrlVars() {
	var vars = {};
	window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m,key,value) {
		vars[key] = value;
	});
	return vars;
}

function isNumber(n) {
	  return !isNaN(parseFloat(n)) && isFinite(n);
	}

/*
//Calculate number of total visible elements within current map bounds
OpenLayers.Map.prototype.getTotalFeatures = function() {
	
	var visibleLayers = this.getLayersBy("visibility", true);
	var totalFeatures = 0;
	for (var i = 0; i < visibleLayers.length; i++) {
		var v = visibleLayers[i];
		if (v.displayInLayerSwitcher && v.features != undefined) {
			for (var j = 0; j < v.features.length; j++) {
				if (this.getExtent().containsBounds(v.features[j].geometry.getBounds())) {
					totalFeatures++;
				}
			}
		}
	}
	return totalFeatures;
};
*/

OpenLayers.Map.prototype.updateStatusLine = function() {
	
	var zoomIn = false;
	var cnt_enabled = 0;
	var totalFeatures = 0;
	
	var visibleLayers = this.getLayersBy("visibility", true);

	for (var i = 0; i < visibleLayers.length; i++) {
		var v = visibleLayers[i];
		if ( v.CLASS_NAME == "OpenLayers.Layer.Vector" &&
		     v.strategies != undefined &&
		     v.strategies[0].active == true && 
			 v.features != undefined) {
					
			cnt_enabled++;
			if (v.map.getZoom() < v._zoom) {
				zoomIn = true;
				break;
			} else {
				for (var j = 0; j < v.features.length; j++) {
					if (this.getExtent().containsBounds(v.features[j].geometry.getBounds())) {
						totalFeatures++;
					}
				}				
			}
		}
	}
	
	if (cnt_enabled == 0) {
		$("#statusline").text(OpenLayers.i18n('nolayer'))
		                .css({ 'color': 'red', 'font-weight': 'bold' });
	} else {
		if (zoomIn) {
			$("#statusline").text(OpenLayers.i18n('zoomin'))
			                .css({ 'color': 'red', 'font-weight': 'bold' });
		} else {
			$("#statusline").text(OpenLayers.i18n('showelements', { number: totalFeatures }))
			                .css({ 'color': 'black', 'font-weight': 'normal' });
		}
	}
};


function setStatusText(text)
{
	var html_node = document.getElementById("statusline");
	if (html_node != null)
	{
		var div = html_node.firstChild;
		div.deleteData(0, div.nodeValue.length);
		div.appendData(text);
	}
}

function setStatusText2(text)
{
	var html_node = document.getElementById("maxheight");
	if (html_node != null)
	{
		var div = html_node.firstChild;
		div.deleteData(0, div.nodeValue.length);
		div.appendData(text);
	}
}



if (typeof console == "undefined") {
    window.console = { log: function (msg) { /* no action */ } };
}

function killMyQueries(layers) {
		
	for (var i = 0; i < layers.length; i++) {
		layers[i].protocol.abort();
		layers[i].removeAllFeatures({silent: true});
		layers[i].strategies[0].bounds = null;     // reset bounds in ZoomLimitedBBOXStrategy as killed request doesn't return any valid features 
	}
	
	if ($.browser.msie && window.XDomainRequest) {
	    //Use Microsoft XDR
	    var xdr = new XDomainRequest();
	    xdr.open("POST", _global_server + "kill_my_queries");
	    
	    xdr.onload = function () { /* no action */ };
	    xdr.onsuccess = function() { /* no action */ };
	    xdr.onerror = function() { /* no action */ };
	    xdr.onprogress = function() { /* no action */ };
	    xdr.timeout = 1000;
	    xdr.send();
	    var response = xdr.responseText;
	} else {	
		$.get(_global_server + "kill_my_queries");
	}
}

function adjustCombinedLayerVisibility() {
	var allVisible = true; // check if all layers marked with _suppress_setVisibility_during_init should be visible    	

	for ( var i = 0, len = this.map.layers.length; i < len; i++) {
		if (this.map.layers[i]._suppress_setVisibility_during_init == true
				&& this.map.layers[i].visibility == false)
			allVisible = false;
	}

	if (allVisible) {
		// yes -> set combined level to visible (not triggering event yet), set layers
		// marked with _suppress_setVisibility_during_init back to false
		// map.js will take care of this later...
		for ( var i = 0, len = this.map.layers.length; i < len; i++) {
			if (this.map.layers[i]._postprocess_setVisibility_during_init == true) {
				this.map.layers[i].visibility = true;
			}
			if (this.map.layers[i]._suppress_setVisibility_during_init == true) {
				this.map.layers[i].visibility = false;    				
			}
		}
	} else {
		for ( var i = 0, len = this.map.layers.length; i < len; i++) {
			if (this.map.layers[i]._suppress_setVisibility_during_init == true
					&& this.map.layers[i].visibility == true) {
				this.map.layers[i].visibility = false;
				this.map.layers[i].setVisibility(true);  // trigger changeLayer event
			}
		}
	}        
	
}

/*
 * Custom OpenLayers.Control.ArgParser.configureLayers function 
 * Ignore layers not shown in layer switcher
 * 
 */

OpenLayers.Control.ArgParser.prototype.configureLayers = function() {
	
	var mapLayersInLayerSwitcher = 0;
	var layerMapping = {};
	
	for (var i = 0, len=this.map.layers.length; i<len; i++) { 
		if (this.map.layers[i].displayInLayerSwitcher == true) {
			layerMapping[mapLayersInLayerSwitcher++] = i;
		}
	}
	
	this.layers = this.layers.substring(0,20);   // support old format
	
    if (this.layers.length == mapLayersInLayerSwitcher) { 
        this.map.events.unregister('addlayer', this, this.configureLayers);

        for(var i=0, len=this.layers.length; i<len; i++) {
            
            var layer = this.map.layers[layerMapping[i]];
            var c = this.layers.charAt(i);
            
            if (c == "B") {
                this.map.setBaseLayer(layer);
            } else if ( (c == "T") || (c == "F") ) {
            	if (layer._suppress_setVisibility_during_init == true) {
            		layer.visibility = ((c == "T"));
            	} else
                layer.setVisibility(c == "T");
            }
        }
        adjustCombinedLayerVisibility();
    }
};

OpenLayers.Control.PermalinkCustom=OpenLayers.Class(OpenLayers.Control.Permalink,{
    createParams: function(center,zoom,layers) {
        var params = OpenLayers.Control.Permalink.prototype.createParams.apply(this,[center,zoom,layers]);

       	params['label'] = _global_showLabel ? 'T' : 'F';
        
        if (_global_classicStyle)
        	params['style'] = 'point';
        else
        	params['style'] = 'line';
        
        params['opacity'] = Math.floor(_global_opacity * 100);
        
        //layers        
        layers = layers || this.map.layers;  
        params.layers = '';
        for (var i=0, len=layers.length; i<len; i++) {
        	var layer = layers[i];

        	if (layer.displayInLayerSwitcher == true) {       // only add layer if shown in layer switcher
        		if (layer.isBaseLayer) {
        			params.layers += (layer == this.map.baseLayer) ? "B" : "0";
        		} else {
        			params.layers += (layer.getVisibility()) ? "T" : "F";           
        		}
        	}
        }

        return params;
    }
});

OpenLayers.Strategy.MapLevelCluster = OpenLayers.Class(OpenLayers.Strategy.Cluster, {

    shouldCluster: function(cluster, feature) {
    	       
        var superProto = OpenLayers.Strategy.Cluster.prototype;

        return (this.layer.map.getZoom() < 17 && 
                superProto.shouldCluster.apply(this, arguments));
    },
    CLASS_NAME: "OpenLayers.Strategy.MapLevelCluster"
});

function jqAlert(msg, success) {
    var dialogObj = $("<div style='display:none'>"+msg+"</div>");
    $('body').append(dialogObj);
    $(dialogObj).dialog({
      resizable: false,
      minHeight: window.innerWidth >= 800 ? 160 : window.innerHeight * 0.5,
      height: window.innerWidth >= 800 ? 200 : window.innerHeight * 0.8,
      minWidth: window.innerWidth >= 800 ? 300 : window.innerWidth * 0.5,
      width: window.innerWidth >= 800 ? 400 : window.innerWidth * 0.8,
      modal: true,
      title: "OSM Truck QA Map",
      buttons: {
        "OK": function() {
         success();
          $( this ).dialog( "close" );
        }
/*    ,
        Cancel: function() {
          $( this ).dialog( "close" );
        }
*/        
      }
    });
}


function exportGPX(layers, layers_intersection) {
	
	var i;
	var valid = true;
	
	if (!_global_classicStyle) {
		for (i = 0; i < layers_intersection.length; i++) {
		
		if (layers_intersection[i].visibility)
			valid = false;
		}
	}
	
	if (!valid) {
		jqAlert(OpenLayers.i18n('export_msg'), function() { /* do nothing */});
		return;
	}
		
    layers.push.apply(layers, layers_intersection);
	

	var gpx = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n';
    gpx += '<gpx creator="maxheight.bplaced.net" version="1.1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1';
    gpx += ' http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/WaypointExtension/v1';
    gpx += ' http://www8.garmin.com/xmlschemas/WaypointExtensionv1.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3';
    gpx += ' http://www8.garmin.com/xmlschemas/GpxExtensionsv3.xsd" xmlns="http://www.topografix.com/GPX/1/1"';
    gpx += ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3">\n';
    
    var counter = 1;
    var point;
	
	for (var i = 0; i < layers.length; i++) {
		
		if (layers[i].visibility) {
			
			for (var j = 0; j < layers[i].features.length; j++) {
				
				var geom = layers[i].features[j].geometry.clone();
				
				if (geom.CLASS_NAME != "OpenLayers.Geometry.Point") {
					point = geom.getCentroid();
				} else {
					point = geom;
				}
				
				point.transform(layers[i].map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
			
				_lat = (point.y).toFixed(5);
				_lon = (point.x).toFixed(5);
				_name = 'MH ' + counter++;
				_color = 'Red';
			
				gpx += '<wpt lat="' + _lat + '" lon="' + _lon + '"><name>' + _name + '</name><sym>Pin, ' + _color + '</sym><type>user</type><extensions><gpxx:WaypointExtension>';
				gpx += '<gpxx:DisplayMode>SymbolOnly</gpxx:DisplayMode><gpxx:Categories><gpxx:Category>Maxheight</gpxx:Category>';
            	gpx += '</gpxx:Categories></gpxx:WaypointExtension></extensions></wpt>\n';
            
			}
			
		}
		
	}
	
	gpx += "</gpx>";
	
	var bb = new BlobBuilder();
	bb.append(gpx);
	var blob = bb.getBlob("application/gpx+xml;charset=" + document.characterSet);
	saveAs(blob, "points.gpx");

	
}

// Test: For performance reasons convert x / y coordinates to int
/*
OpenLayers.Renderer.SVG.prototype.getShortString = function(point) {
    var resolution = this.getResolution();
    var x = ((point.x - this.featureDx) / resolution + this.left);
    var y = (this.top - point.y / resolution);

    if (this.inValidRange(x, y)) { 
        return x.toFixed(0) + "," + y.toFixed(0);   // convert to int
    } else {
        return false;
    }
};

*/