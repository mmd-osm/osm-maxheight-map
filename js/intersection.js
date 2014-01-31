/**
 * Method: intersectsInnerPoints
 * Test for intersection between two geometries on inner points only
 * (similar to PostGIS st_crosses)
 * added for maxheight map
 *
 * Parameters:
 * geometry - {<OpenLayers.Geometry>}
 *
 * Returns:
 * {Boolean} The input geometry intersects this geometry.
 */
OpenLayers.Geometry.LineString.prototype.intersectsInnerPoints = function(geometry, options) {
	var intersect = false;
	var type = geometry.CLASS_NAME;
	if(type == "OpenLayers.Geometry.LineString" ||
			type == "OpenLayers.Geometry.LinearRing" ||
			type == "OpenLayers.Geometry.Point") {
		var segs1 = this.getSortedSegments();
		var segs2;
		if(type == "OpenLayers.Geometry.Point") {
			segs2 = [{
				x1: geometry.x, y1: geometry.y,
				x2: geometry.x, y2: geometry.y
			}];
		} else {
			segs2 = geometry.getSortedSegments();
		}
		var seg1, seg1x1, seg1x2, seg1y1, seg1y2,
		seg2, seg2y1, seg2y2;
		// sweep right
		outer: for(var i=0, len=segs1.length; i<len; ++i) {
			seg1 = segs1[i];
			seg1x1 = seg1.x1;
			seg1x2 = seg1.x2;
			seg1y1 = seg1.y1;
			seg1y2 = seg1.y2;
			inner: for(var j=0, jlen=segs2.length; j<jlen; ++j) {
				seg2 = segs2[j];
				if(seg2.x1 > seg1x2) {
					// seg1 still left of seg2
					break;
				}
				if(seg2.x2 < seg1x1) {
					// seg2 still left of seg1
					continue;
				}
				seg2y1 = seg2.y1;
				seg2y2 = seg2.y2;
				if(Math.min(seg2y1, seg2y2) > Math.max(seg1y1, seg1y2)) {
					// seg2 above seg1
					continue;
				}
				if(Math.max(seg2y1, seg2y2) < Math.min(seg1y1, seg1y2)) {
					// seg2 below seg1
					continue;
				}
				// >> ignore intersection on end points (similar to st_crosses) - special logic for maxheight map
				var segIntersect = OpenLayers.Geometry.segmentsIntersect(seg1, seg2, { point: true });
				if(segIntersect.CLASS_NAME == "OpenLayers.Geometry.Point") {

					if (type == "OpenLayers.Geometry.LineString") {

						if (!(this.components[0].equals(segIntersect) ||
								this.components[this.components.length - 1].equals(segIntersect) ||
								geometry.components[0].equals(segIntersect) ||
								geometry.components[geometry.components.length - 1].equals(segIntersect))) {
							intersect = true;
							if (options.allIntersectionPoints) {
							   options.callback(segIntersect);	
							} else
							break outer;
						}
					} else if (type == "OpenLayers.Geometry.LinearRing") {   
						if (!(this.components[0].equals(segIntersect) ||
								this.components[this.components.length - 1].equals(segIntersect) ||
								(seg2.x1 == segIntersect.x && seg2.y1 == segIntersect.y) ||
								(seg2.x2 == segIntersect.x && seg2.y2 == segIntersect.y))) {
							intersect = true;
							if (options.allIntersectionPoints) {
								   options.callback(segIntersect);	
								} else
							break outer;
						}
					}
				} else if (segIntersect) {
					intersect = true;
					if (options.allIntersectionPoints) {
						   options.callback(segIntersect);	
						} else
					break outer;
				}
				// << ignore intersection on end points
			}
		}
	} else {
		// intersect = geometry.intersects(this);
		intersect = geometry.intersectsInnerPoints(this, options);    // special logic for maxheight map
	}
	return intersect;
};

/**
 * Method: intersectsInnerPoints
 * Determine if the input geometry intersects this one.
 * (similar to PostGIS st_crosses)
 * added for maxheight map
 *
 * Parameters:
 * geometry - {<OpenLayers.Geometry>} Any type of geometry.
 *
 * Returns:
 * {Boolean} The input geometry intersects this one.
 */

OpenLayers.Geometry.Polygon.prototype.intersectsInnerPoints = function(geometry, options) {
	var intersect = false;
	var i, len;
	if(geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
		intersect = this.containsPoint(geometry);
	} else if(geometry.CLASS_NAME == "OpenLayers.Geometry.LineString" ||
			geometry.CLASS_NAME == "OpenLayers.Geometry.LinearRing") {
		// check if rings/linestrings intersect
		for(i=0, len=this.components.length; i<len; ++i) {
			// intersect = geometry.intersects(this.components[i]);
			intersect = geometry.intersectsInnerPoints(this.components[i], options);  // special logic for maxheight map

			if(intersect && !options.allIntersectionPoints) {
				break;
			}
		}
		/* ignore -- special logic for maxheight map 
            if(!intersect) {
                // check if this poly contains points of the ring/linestring
                for(i=0, len=geometry.components.length; i<len; ++i) {
                    intersect = this.containsPoint(geometry.components[i]);
                    if(intersect) {
                        break;
                    }
                }
            }
		 */
	} else {
		for(i=0, len=geometry.components.length; i<len; ++ i) {
			intersect = this.intersects(geometry.components[i]);
			if(intersect) {
				break;
			}
		}
	}
	// check case where this poly is wholly contained by another
	if(!intersect && geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon") {
		// exterior ring points will be contained in the other geometry
		var ring = this.components[0];
		for(i=0, len=ring.components.length; i<len; ++i) {
			intersect = geometry.containsPoint(ring.components[i]);
			if(intersect) {
				break;
			}
		}
	}
	return intersect;
};


//Memoization getSortedSegments results (performance)
OpenLayers.Geometry.LineString.prototype.getSortedSegments =
	( function(old) {
		
		this._buffer = undefined;
		
		return function() {
			if (this._buffer == undefined)
			   this._buffer = old.apply(this);
			return this._buffer;
		};
		
	}) (OpenLayers.Geometry.LineString.prototype.getSortedSegments);


function featureFilterIntersection(feature) {

	var feat1, feat2, intersects12, intersects21;
	var layer_upper,         // higher level - bridge
	    layer_lower;         // lower level - way
	var parts = [];

	if (feature.length == 0) return feature;
	
	var maxheightNodesExist = false;
	
	var osm_ids_node = {};
	

	var points = [];
	var points_tmp = [];    // temporary intersections points. these are only added
							// to final result, if no maxheight nodes are close by.

	var collectObjects = function(obj) {

		var i;
		
		var vec = new OpenLayers.Feature.Vector(obj);
		vec.type = obj.CLASS_NAME;
				
		if (vec.type == "OpenLayers.Geometry.Point") {
			for (i = 0; i < points.length; i++) {
				var distance = (points[i].geometry).distanceTo(vec.geometry);
				if (distance < 0.00001) {   // TODO: check if this value really makes sense
					return;
				}
			}
			for (i = 0; i < points_tmp.length; i++) {
				var distance = (points_tmp[i].geometry).distanceTo(vec.geometry);
				if (distance < 0.00001) {   // TODO: check if this value really makes sense
					return;
				}
			}			
			points_tmp.push(vec);
		}
	};
	
	
	for (var i = 0; i < feature.length; i++) {
		if (feature[i].fid.substr(0,4) == "node") { 
	  	 // OSMTimeoutFormat already filtered out all nodes without maxheight tag,
	     // so it is safe to assume we're processing maxheight nodes only. 
		  osm_ids_node[feature[i].osm_id] = true;
		  maxheightNodesExist = true;
		}
	}

	for (var i=0; i<feature.length; i++) 
		feature[i]._element_added = false;

	for (var i=0; i<feature.length; i++) {
		feat1 = feature[i];
		
		if (feat1.attributes["bridge"] == undefined)
			continue;
		
		if (feat1.fid.substr(0,3) != "way")   //ignore points for intersection check
		 continue;             
		
		layer_upper = parseInt(feat1.attributes["layer"]);
		if (layer_upper == undefined || isNaN(layer_upper))
			layer_upper = 1;
		
		for (var j=0;j<feature.length; j++) {
			if (i == j)
				continue;
			feat2 = feature[j];
			if (feat2.attributes["highway"] == undefined)
				continue;
			
			if (feat2.fid.substr(0,3) != "way")   //ignore points for intersection check
				 continue;   

			layer_lower = parseInt(feat2.attributes["layer"]);
			if (layer_lower == undefined || isNaN(layer_lower))
				layer_lower = 0;

			if (!(layer_lower < layer_upper))
				continue;

			if (feat2.attributes["highway"] == "motorway")      // motorways are not analyzed for missing maxheight tags
				continue;

			// ignore ways with maxheight tag -- this might happen in bridge below bridge scenarios
			// Overpass QL request doesn't filter this part out yet
			if (!(feat2.attributes["maxheight"]          == undefined) &&     
				 (feat2.attributes["maxheight:physical"] == undefined)) {
				continue;
			}
			
			points_tmp = [];   // initialize temporary intersection points			

			//intersects12 = feat1.geometry.intersectsInnerPoints(feat2.geometry, { allIntersectionPoints: false });  // special function for maxheight map
			intersects21 = feat2.geometry.intersectsInnerPoints(feat1.geometry, { allIntersectionPoints: _global_classicStyle, callback: collectObjects });
 
/* 		    
  			if (intersects12 != intersects21) {
				// major screw up, log it to console
				console.log ("feat1: " + feat1.osm_id + "["+ feat1.geometry.CLASS_NAME + "], feat2: " + 
						feat2.osm_id + "[" + feat2.geometry.CLASS_NAME + "] --> " +
						intersects12 + "/" + intersects21);
			}
*/

			if ( /* intersects12 || */ intersects21) {

				// check for a maxheight tag on any of the feat2's nodes 
				var comp = feat2.geometry.components;
				var nearbyMaxheightNodeFound = false;
				if (maxheightNodesExist) {
					for (var k = 0; k < comp.length && !nearbyMaxheightNodeFound; k++) {
						if (comp[k].CLASS_NAME != "OpenLayers.Geometry.Point")
							continue;
						if (osm_ids_node[comp[k].osm_id] != undefined) {
							// check, if feat1 is close enough to one of feat2's node tagged w/ maxheight=*
							var distance = comp[k].distanceTo(feat1.geometry);
							if (distance < 0.0001)
								nearbyMaxheightNodeFound = true;
							//console.log(distance + " for " + feat1.osm_id + " / "  + feat2.osm_id + " - found=" + nearbyMaxheightNodeFound);
						}
					}
				}

				if (!nearbyMaxheightNodeFound) {
					if (!feature[i]._element_added) {
						parts.push(feat1);
						feature[i]._element_added = true;
					}
					if (!feature[j]._element_added) {
						parts.push(feat2);
						feature[j]._element_added = true;
					}
					points.push.apply(points, points_tmp);
				}
			}
		}
	}
	return (_global_classicStyle ? points : parts);
}

