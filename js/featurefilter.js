
	function featureFilterPassAll(feature) {
		return feature;
	} 
	
	function featureFilterSimplifyLineString(feature) {
		
		var result = [];
		
		for (var i = 0; i < feature.length; i++) {
			if (feature[i].CLASS_NAME == "OpenLayers.Geometry.LineString")
				result.push(feature[i].simplify(0.05));
			else
				result.push(feature[i]);
		}
		
		return result;
	}
	
	/* Method: featureFilterMaxheightIsSetOnNode
	 * 
	 * Maxheight Tags on nodes are propagated to ways, i.e. if a
	 * way has a node with maxheight=* tag, it will be filtered out
	 * by this method. Also, only ways are returned by this method.
	 * 
	 * Also see: OSMTimeoutFormat
	 */
	
	function featureFilterMaxheightIsSetOnNode(feature) {
		
		var osm_ids_node = {};
		var result = [];
		
		for (var i = 0; i < feature.length; i++) {
			if (feature[i].fid.substr(0,4) == "node")
			  osm_ids_node[feature[i].osm_id] = true;
		}
		
		for (var i = 0; i < feature.length; i++) {
			if (feature[i].fid.substr(0,3) == "way") {
				var comp = feature[i].geometry.components;
				var found = false;
				for (var j = 0; j < comp.length && !found; j++) {
					if (comp[j].CLASS_NAME != "OpenLayers.Geometry.Point")
					  continue;
					if (osm_ids_node[comp[j].osm_id] != undefined) 
						found = true;
				}
                if (!found)
				  result.push(feature[i]);
			};
		}
		
		return result;
	};
