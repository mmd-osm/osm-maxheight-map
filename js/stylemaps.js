function getHeightValueColor(feature, key) {

	var valueArray = feature.attributes[key].split(";");
	var resultStatusOK = true; 

	for (var i = 0; i < valueArray.length; i++) {

		var v = valueArray[i].trim();

		// Check 1: feet & inches
		if (/^([\d.]+ ?(ft|feet|'))(-| )?([\d.]+( )?(in|"))?$/.test(v) == true) {
			continue;
		} 

		// Check 2: metric values with or w/o "m", comma or full stop
		if (/^\d+[.,]?\d* *[m]?$/.test(v) == true) {
			var mh = parseFloat(v);
/*			if (mh >= 5) 
				return "blue";           // maxheight >= 5  -> blue
*/
			if (_global_maxheight <= mh)
				return "blue";
			
			continue;
		}

		resultStatusOK = false;
	}

	if (resultStatusOK)
		return "red";

	return "#FF00FF";    // not recognized
}



function getMaxheightStyleMap() {

// 2013-12-19 - added additional values for "none" like values (unspecified + default)
//              discussion is ongoing...	
	var isMaxheightNone = function (feature) {
		return ((feature.attributes["maxheight"] == "none") || 
				(feature.attributes["maxheight:physical"] == "none") ||
				(feature.attributes["maxheight"] == "unspecified") ||
				(feature.attributes["maxheight"] == "default")			
		);
	};

	var olTemplate = {
			strokeColor : '${getColor}',
			strokeOpacity : '${getStrokeOpacity}',
			strokeWidth : '${getStrokeWidth}',
			pointRadius : 7,
			fillColor : '${getColor}',
			fillOpacity : 0.2,
			label : '${getLabel}',
			fontColor : "black",
			fontSize : "9px",
			fontFamily : "Arial",
			fontWeight : "normal",
			labelOutlineColor : "white",
			labelOutlineWidth : 8,
			fontOpacity : 0.75,
			labelXOffset : 10,
			labelYOffset : 10,
			cursor: "pointer"
	};

	var olContext = {
			getColor: function(feature) {
				if (isMaxheightNone(feature)) {
					return '#00FF00';              // maxheight=none -> green
				} else {
					if (!(feature.attributes["maxheight"] == undefined)) 
						return getHeightValueColor(feature, "maxheight");
					if (!(feature.attributes["maxheight:physical"] == undefined))
						return getHeightValueColor(feature, "maxheight:physical");
					return "#FF00FF";    // not recognized
				}
			},
			getLabel: function(feature) {
				if (!_global_showLabel)
					return '';                      
				if (isMaxheightNone(feature)) {
					return '';              // maxheight=none -> green
				} else {
					if (!(feature.attributes["maxheight"] == undefined)) 
						return feature.attributes["maxheight"];
					if (!(feature.attributes["maxheight:physical"] == undefined))
						return feature.attributes["maxheight:physical"];
					return '';
				}
			},
			getStrokeWidth: function(feature) {
				return isMaxheightNone(feature) ? 3 : 6;
			},
			getStrokeOpacity: function(feature) {
				return 0.8;
			}
	};

	var olStyle = new OpenLayers.Style(olTemplate, {context: olContext});

	var olStyleMap = new OpenLayers.StyleMap({
		'default': olStyle,
		'select': olStyle
	});

	return olStyleMap;
}


function getHGVRoutingStyleMap() {


	var olTemplate = {  strokeColor: '${getColor}',
			strokeOpacity: '${getStrokeOpacity}',
			strokeWidth: '${getStrokeWidth}',
			strokeDashstyle: '${getStrokeDashstyle}',
			pointRadius: 7,
			fillColor: '${getColor}',
			fillOpacity: 0.2,
			cursor: "pointer"
	};

	var olContext = {
			getColor: function(feature) {
				var color = '#000000';
				var hz = undefined;
				if (feature.attributes["hazmat"] != undefined)
					hz = feature.attributes["hazmat"];
				if (feature.attributes["hazmat:forward"] != undefined)
					hz = feature.attributes["hazmat:forward"];
				if (feature.attributes["hazmat:backward"] != undefined)
					hz = feature.attributes["hazmat:backward"];				
				
				if (!hz == undefined) {		
					switch (hz) {
					case 'yes':
					case 'designated':
						color = '#009c66';
						break;
					case 'destination':
						color = '#ff4dff';
						break;
					case 'no':
						color = '#b300b3';
						break;  
					default:
						color = '#b3b300';
					break; 
					}
				}
				if (!(feature.attributes["hazmat:water"] == undefined)) {
					switch (feature.attributes["hazmat:water"]) {
					case 'yes':
					case 'designated':
						color = '#009c66';
						break;
					case 'destination':
						color = '#ff4dff';
						break;
					case 'no':
						color = '#b300b3';
						break;  
					default:
						color = '#b3b300';
					break; 
					}
				}
				if (!(feature.attributes["hgv"] == undefined)) {
					switch (feature.attributes["hgv"]) {
					case 'yes':
					case 'designated':
						color = '#00cc00';
						break;
					case 'lane':
						color = '#00b3ff';
						break;
					case 'local':
					case 'destination':
					case 'delivery':
						color = '#ff8000';
						break;                                 
					case 'no':
						color = '#ff0000';
						break;  
					default:
						color = '#b3b300';
					break; 
					}

				}
				return color;

			},
			getStrokeWidth: function(feature) {
				return 3;
			},
			getStrokeOpacity: function(feature) {
				return 1;
			},
			getStrokeDashstyle: function(feature) {
				if (!(feature.attributes["hazmat:forward"] == undefined &&
                 	 feature.attributes["hazmat:backward"] == undefined))
					return "dotted";

				else
					return "solid";
	
			}
	};

	var olStyle = new OpenLayers.Style(olTemplate, {context: olContext});

	var olStyleMap = new OpenLayers.StyleMap({
		'default': olStyle,
		'select': olStyle
	});

	return olStyleMap;
}



function getHGVMaxspeedStyleMap() {


	var olTemplate = {  strokeColor: '${getColor}',
			strokeOpacity: '${getStrokeOpacity}',
			strokeWidth: '${getStrokeWidth}',
			pointRadius: 7,
			fillColor: '${getColor}',
			fillOpacity: 0.2,
			label:         '${getLabel}',
			fontColor:     "black",
			fontSize:      "9px",
			fontFamily:    "Arial",
			fontWeight:    "normal",
			labelOutlineColor: "white",
			labelOutlineWidth: 8,
			fontOpacity:       0.75,
			labelXOffset:      10,
			labelYOffset:      10,
			cursor: "pointer"
	};

	var olContext = {
			getColor: function(feature) {

				var x = feature.attributes["maxspeed:hgv"];
				var y = parseInt (x);
				if (!(x == undefined)) {
					switch (true) {          // see: http://wiki.openstreetmap.org/wiki/DE:MaxSpeed_Karte
					case (x == "none"):
					case (x == "no"):
					case (x == "unlimited"):  return "#0040FF";
					case (x == "variable"):   return "#CC00FF";
					case (x == "signals"):    return "#CC00FF";
					case (y >= 130):          return "#00BFFF";
					case (y >= 110):          return "#87CEEB";
					case (y >= 100):          return "#66CDAA";
					case (y >=  90):          return "#3CB371";
					case (y >=  80):          return "#32CD32";
					case (y >=  70):          return "#ADFF2F";
					case (y >=  60):          return "#FFDF00";
					case (y >=  50):          return "#FF9F00";
					case (y >=  40):          return "#FF6000";
					case (y >=  30):          return "#FF2000";
					case (y >=  25):          return "#C00000";
					case (y >=  20):          return "#800000";
					case (y >=  15):          return "#C05000";
					case (y >=  10):          return "#D56A00";
					case (y >=   7):          return "#AA5500";
					case (y >=   6):          return "#905000";
					case (y >=   5):          return "#804000";
					default:                  return "#A0A0A0";
					}
				}

			},
			getStrokeWidth: function(feature) {
				return 3;
			},
			getStrokeOpacity: function(feature) {
				return 1;
			},
			getLabel: function(feature) {
				if (!_global_showLabel)
					return '';                      
				if (!(feature.attributes["maxspeed:hgv"] == undefined)) 
					return feature.attributes["maxspeed:hgv"];
				return '';
			}
	};

	var olStyle = new OpenLayers.Style(olTemplate, {context: olContext});

	var olStyleMap = new OpenLayers.StyleMap({
		'default': olStyle,
		'select': olStyle
	});

	return olStyleMap;
}


function getMaxweightStyleMap() {


	var olTemplate = {  strokeColor: '${getColor}',
			strokeOpacity: '${getStrokeOpacity}',
			strokeWidth: '${getStrokeWidth}',
			pointRadius: 7,
			fillColor: '${getColor}',
			fillOpacity: 0.2,
			label:         '${getLabel}',
			fontColor:     "black",
			fontSize:      "9px",
			fontFamily:    "Arial",
			fontWeight:    "normal",
			labelOutlineColor: "white",
			labelOutlineWidth: 8,
			fontOpacity:       0.75,
			labelXOffset:      10,
			labelYOffset:      10,
			cursor: "pointer"
	};

	var olContext = {
			getColor: function(feature) {
				var maxweight = undefined;
				
				maxweight = feature.attributes["maxweight:forward"];
				if (maxweight == undefined)
					maxweight = feature.attributes["maxweight:backward"];
				if (maxweight == undefined)
					maxweight = feature.attributes["maxweight"];
				
				if (!(maxweight == undefined)) {
					try {
					   var mw = parseFloat(maxweight);
						if (_global_maxweight <= mw) 
							return "blue";
						else 
							return "red";

					   
					} catch (e) {
						return "red";
					}
				}
			},
			getStrokeWidth: function(feature) {
				return 3;
			},
			getStrokeOpacity: function(feature) {
				return 1;
			},
			getLabel: function(feature) {
				if (!_global_showLabel)
					return '';
				var res = "";
				if (!(feature.attributes["maxweight:forward"] == undefined)) 
					res = res + "->" + feature.attributes["maxweight:forward"] + " ";				
				if (!(feature.attributes["maxweight:backward"] == undefined)) 
					res = res + "<-" + feature.attributes["maxweight:backward"] + " ";				
				if (!(feature.attributes["maxweight"] == undefined)) 
					res = res + feature.attributes["maxweight"];
				
				return res;
			}
	};

	var olStyle = new OpenLayers.Style(olTemplate, {context: olContext});

	var olStyleMap = new OpenLayers.StyleMap({
		'default': olStyle,
		'select': olStyle
	});

	return olStyleMap;
}

function getMaxaxleloadStyleMap() {

	var olTemplate = {  strokeColor: '${getColor}',
			strokeOpacity: '${getStrokeOpacity}',
			strokeWidth: '${getStrokeWidth}',
			pointRadius: 7,
			fillColor: '${getColor}',
			fillOpacity: 0.2,
			label:         '${getLabel}',
			fontColor:     "black",
			fontSize:      "9px",
			fontFamily:    "Arial",
			fontWeight:    "normal",
			labelOutlineColor: "white",
			labelOutlineWidth: 8,
			fontOpacity:       0.75,
			labelXOffset:      10,
			labelYOffset:      10,
			cursor: "pointer"
	};

	var olContext = {
			getColor: function(feature) {
				if (!(feature.attributes["maxaxleload"] == undefined)) {
					return "red";
				}
			},
			getStrokeWidth: function(feature) {
				return 3;
			},
			getStrokeOpacity: function(feature) {
				return 1;
			},
			getLabel: function(feature) {
				if (!_global_showLabel)
					return '';                      
				if (!(feature.attributes["maxaxleload"] == undefined)) 
					return feature.attributes["maxaxleload"];

				return '';
			}
	};

	var olStyle = new OpenLayers.Style(olTemplate, {context: olContext});

	var olStyleMap = new OpenLayers.StyleMap({
		'default': olStyle,
		'select': olStyle
	});

	return olStyleMap;
}

function getMaxwidthStyleMap() {


	var olTemplate = {  strokeColor: '${getColor}',
			strokeOpacity: '${getStrokeOpacity}',
			strokeWidth: '${getStrokeWidth}',
			pointRadius: 7,
			fillColor: '${getColor}',
			fillOpacity: 0.2,
			label:         '${getLabel}',
			fontColor:     "black",
			fontSize:      "9px",
			fontFamily:    "Arial",
			fontWeight:    "normal",
			labelOutlineColor: "white",
			labelOutlineWidth: 8,
			fontOpacity:       0.75,
			labelXOffset:      10,
			labelYOffset:      10,
			cursor: "pointer"
	};

	var olContext = {
			getColor: function(feature) {
				if (!(feature.attributes["maxwidth"] == undefined)) {
					return "red";
				}

			},
			getStrokeWidth: function(feature) {
				return 3;
			},
			getStrokeOpacity: function(feature) {
				return 1;
			},
			getLabel: function(feature) {
				if (!_global_showLabel)
					return '';                      
				if (!(feature.attributes["maxwidth"] == undefined)) 
					return feature.attributes["maxwidth"];

				return '';
			}
	};

	var olStyle = new OpenLayers.Style(olTemplate, {context: olContext});

	var olStyleMap = new OpenLayers.StyleMap({
		'default': olStyle,
		'select': olStyle
	});

	return olStyleMap;
}


function getMaxlengthStyleMap() {


	var olTemplate = {  strokeColor: '${getColor}',
			strokeOpacity: '${getStrokeOpacity}',
			strokeWidth: '${getStrokeWidth}',
			pointRadius: 7,
			fillColor: '${getColor}',
			fillOpacity: 0.2,
			label:         '${getLabel}',
			fontColor:     "black",
			fontSize:      "9px",
			fontFamily:    "Arial",
			fontWeight:    "normal",
			labelOutlineColor: "white",
			labelOutlineWidth: 8,
			fontOpacity:       0.75,
			labelXOffset:      10,
			labelYOffset:      10,
			cursor: "pointer"
	};

	var olContext = {
			getColor: function(feature) {

				if (!(feature.attributes["maxlength"] == undefined)) {
					return "red";
				}

			},
			getStrokeWidth: function(feature) {
				return 3;
			},
			getStrokeOpacity: function(feature) {
				return 1;
			},
			getLabel: function(feature) {
				if (!_global_showLabel)
					return '';                      
				if (!(feature.attributes["maxlength"] == undefined)) 
					return feature.attributes["maxlength"];

				return '';
			}
	};

	var olStyle = new OpenLayers.Style(olTemplate, {context: olContext});

	var olStyleMap = new OpenLayers.StyleMap({
		'default': olStyle,
		'select': olStyle
	});

	return olStyleMap;
}


function getTollStyleMap() {


	var olTemplate = {  strokeColor: '${getColor}',
			strokeOpacity: '${getStrokeOpacity}',
			strokeWidth: '${getStrokeWidth}',
			pointRadius: 7,
			fillColor: '${getColor}',
			fillOpacity: 0.2,
			cursor: "pointer"
	};

	var olContext = {
			getColor: function(feature) {

				if (!(feature.attributes["barrier"] == undefined))
					return "blue";

				if (!(feature.attributes["toll"] == undefined)) {
					switch (feature.attributes["toll"]) {
					case "yes": return "red"; 
					case "no" : return "#00FF00";
					}
				}
				if (!(feature.attributes["toll:N3"] == undefined)) {
					switch (feature.attributes["toll:N3"]) {
					case "yes": return "#FF00FF"; 
					case "no" : return "#00FF00";
					}
				}
				if (!(feature.attributes["toll:n3"] == undefined)) {
					switch (feature.attributes["toll:n3"]) {
					case "yes": return "#FF00FF"; 
					case "no" : return "#00FF00";
					}
				}

			},
			getStrokeWidth: function(feature) {
				return 3;
			},
			getStrokeOpacity: function(feature) {
				return 1;
			}
	};

	var olStyle = new OpenLayers.Style(olTemplate, {context: olContext});

	var olStyleMap = new OpenLayers.StyleMap({
		'default': olStyle,
		'select': olStyle
	});

	return olStyleMap;
}


function getSingleColorStyleMap(color) {

	var olTemplate = {  strokeColor: color,
			strokeOpacity: 1,
			strokeWidth: 3,
			pointRadius: 7,
			fillColor: color,
			fillOpacity: 0.2,
			cursor: "pointer"
	};

	var olContext = { };

	var olStyle = new OpenLayers.Style(olTemplate, {context: olContext});

	var olStyleMap = new OpenLayers.StyleMap({
		'default': olStyle,
		'select': olStyle
	});

	return olStyleMap;
}

function getMarkBridgeStyleMap() {

	var isBridge = function (feature) {
		return ((feature.attributes["bridge"] == "yes") || 
				(feature.attributes["bridge"] == "viaduct"));
	};

	var getLayer = function (feature) {

		var layer = parseInt(feature.attributes["layer"]);
		if (layer == undefined || isNaN(layer))
			layer = isBridge(feature) ? 1 : 0;
		return layer;
	};

	var olTemplate = {
			strokeColor : '${getColor}',
			strokeOpacity : 0.8,
			strokeWidth : '${getStrokeWidth}',
			pointRadius : 7,
			fillColor : '${getColor}',
			fillOpacity : 0.2,
			graphicZIndex : "${getzIndex}",
			cursor: "pointer"
	};

	var olContext = {         // complex example: http://www.openstreetmap.org/?zoom=16&lat=50.33503&lon=7.587
			getColor: function(feature) {
				switch (getLayer(feature)) {
				case 0:  return "red";
				case 1:  return "blue";
				case 2:  return "#00FF99";
				case 3:  return "#FF00FF";
				default: return "#FF0000";
				}
			},
			getzIndex: function(feature) {
				return (getLayer(feature));
			},
			getStrokeWidth: function(feature) {
				return 3 + 0.5 * getLayer(feature);
			}
	};

	var olStyle = new OpenLayers.Style(olTemplate, {context: olContext});

	var olStyleMap = new OpenLayers.StyleMap({
		'default': olStyle,
		'select': olStyle
	});

	return olStyleMap;
}

function getMarkCombinedBridgeStyleMap() {

	var isBridge = function (feature) {
		return ((feature.attributes["bridge"] == "yes") || 
				(feature.attributes["bridge"] == "viaduct"));
	};

	var isRailway = function (feature) {
		// some highways are also tagged with railway=tram. For our analysis
		// treat this way as highway rather than railway, i.e. highway has
		// higher prio
		// example: http://www.openstreetmap.org/?lat=51.21238&lon=6.79094&zoom=16

		return (!(feature.attributes["railway"] == undefined) &&
				(feature.attributes["highway"] == undefined));   
	};

	var getLayer = function (feature) {

		var layer = parseInt(feature.attributes["layer"]);
		if (layer == undefined || isNaN(layer))
			layer = isBridge(feature) ? 1 : 0;
		return layer;
	};

	var olTemplate = {
			strokeColor : '${getColor}',
			strokeOpacity : 0.8,
			strokeWidth : '${getStrokeWidth}',
			pointRadius : 7,
			fillColor : '${getColor}',
			fillOpacity : 0.2,
			graphicZIndex : "${getzIndex}",
			cursor: "pointer"
	};

	var olContext = {         // complex example: http://www.openstreetmap.org/?zoom=16&lat=50.33503&lon=7.587
			getColor: function(feature) {

				if (isRailway(feature)) 
					return 'blue';
								
				switch (getLayer(feature)) {
				case 0:  return "red";
				case 1:  return "blue";
				case 2:  return "#00FF99";
				case 3:  return "#FF00FF";
				default: return "#FF0000";
				}
			},
			getzIndex: function(feature) {
				return (getLayer(feature));
			},
			getStrokeWidth: function(feature) {
				if (isRailway(feature)) 
					return '3';
				
				return 3 + 0.5 * getLayer(feature);
			}
	};

	var olStyle = new OpenLayers.Style(olTemplate, {context: olContext});

	var olStyleMap = new OpenLayers.StyleMap({
		'default': olStyle,
		'select': olStyle
	});

	return olStyleMap;
}

function getRailwayStyleMap() {

	var isRailway = function (feature) {
		// some highways are also tagged with railway=tram. For our analysis
		// treat this way as highway rather than railway, i.e. highway has
		// higher prio
		// example: http://www.openstreetmap.org/?lat=51.21238&lon=6.79094&zoom=16

		return (!(feature.attributes["railway"] == undefined) &&
				(feature.attributes["highway"] == undefined));   
	};

	var olTemplate = {  strokeColor: '${getColor}',
			strokeOpacity: 0.9,
			strokeWidth: '${getStrokeWidth}',
			pointRadius: 7,
			fillColor: '${getColor}',
			fillOpacity: 0.2,
			cursor: "pointer"
	};

	var olContext = {
			getColor: function(feature) {
				return isRailway(feature) ? 'blue' : 'red';
			},
			getStrokeWidth: function(feature) {
				return isRailway(feature) ? '3' : '4';
			}
	};

	var olStyle = new OpenLayers.Style(olTemplate, {context: olContext});

	var olStyleMap = new OpenLayers.StyleMap({
		'default': olStyle,
		'select': olStyle
	});

	return olStyleMap;
}
