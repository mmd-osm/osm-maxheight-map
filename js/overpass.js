
   
ZoomLimitedBBOXStrategy = OpenLayers.Class(OpenLayers.Strategy.BBOX, {

	zoom_data_limit: 13,

	use_IE_workaround: false,

	initialize: function(options) {
		OpenLayers.Strategy.BBOX.prototype.initialize.apply(this, [options]);
		this.zoom_data_limit = options.zoom;
		try {
           this.use_IE_workaround = window.XDomainRequest && (window.XMLHttpRequest && new XMLHttpRequest().responseType === undefined);
		} catch (Err) {  /* no action */ }
	},
	
	merge: function(resp) {
		//console.log ("merge: " + resp.priv.status);
		if (resp.priv.status != 200) {
			if (resp.priv.status != 0)   // ignore longer running query aborted by kill_my_queries -> don't bother user with meaningless message
			   $("#statusline").text(OpenLayers.i18n('erroroccured', 
					                 { code: resp.priv.status, msg: resp.priv.statusText }))
					           .css({ 'color': 'red', 'font-weight': 'bold' });
			this.bounds = null;
			this.layer.removeAllFeatures({silent: true});
			this.layer.events.triggerEvent("loadend");
			return;
		}
		OpenLayers.Strategy.BBOX.prototype.merge.apply(this, [resp]);
	},

	update: function(options) {

		this.ratio = this.layer.ratio;
		var mapBounds = this.getMapBounds();
			
		if (this.layer && this.layer.map && this.layer.map.getZoom() < this.zoom_data_limit) {
			this.layer.map.updateStatusLine();
			this.layer.removeAllFeatures({silent: true});
			this.bounds = null;
		}
		else if (mapBounds !== null && ((options && options.force) ||
				this.invalidBounds(mapBounds))) {

			if (!this.layer.getVisibility())    // don't trigger read, if layer is not visible
				return;

			$("#statusline").text(OpenLayers.i18n('loading'))
			                .css({ 'color': 'black', 'font-weight': 'normal' });

			this.calculateBounds(mapBounds);
			this.resolution = this.layer.map.getResolution();

			this.triggerRead_custom(options, this.use_IE_workaround);

		}
	},

	triggerRead_custom: function (options, use_IE_workaround) {

		if (this.response && !(options && options.noAbort === true)) {
			this.layer.protocol.abort(this.response);
			this.layer.events.triggerEvent("loadend");
		}
		this.layer.events.triggerEvent("loadstart");

		this.response = this.layer.protocol.read_custom(
				OpenLayers.Util.applyDefaults({
					filter: this.createFilter(),
					callback: this.merge,
					scope: this
				}, options), use_IE_workaround);
	},

	CLASS_NAME: "ZoomLimitedBBOXStrategy"
});


function gen_query_string(query, timeout, bbox, x_partitions, y_partitions) {

	var delta_x = ( bbox[3] - bbox[1] ) / x_partitions;
	var delta_y = ( bbox[2] - bbox[0] ) / y_partitions;

	var base_x = bbox[1];
	var base_y = bbox[0];

	var overlap = 1.02;  //overlap factor

	var result = '[timeout:'+ timeout + '];(';

	for (var i = 0; i < x_partitions; i++)
		for (var j = 0; j < y_partitions; j++) {
			var min_x = base_x + i * delta_x;
			var min_y = base_y + j * delta_y;
			var max_x = base_x + (i+1 * (i + 1 == x_partitions ? 1 : overlap)) * delta_x;
			var max_y = base_y + (j+1 * (j + 1 == y_partitions ? 1 : overlap)) * delta_y;
			var bbox_fragment = Number(min_x.toFixed(6)) + ',' + Number(min_y.toFixed(6)) + ',' 
			+ Number(max_x.toFixed(6)) + ',' + Number(max_y.toFixed(6));
			result += query.replace("{{bbox}}", bbox_fragment);
		}

	result += ');out;';

	return (result);
}

function optimize_partitions(bbox) {

	var minx = undefined;
	var miny = undefined;
	var minarea = 10000000;
	
	var maxPartitions = {   11: 10,
			12: 6,
			13: 4,
			14: 4,
			15: 4,
			16: 4,
			17: 4,
			18: 2,
			19: 2
	};
	
	try {
		var zoom = this.map.getZoom();

		for (var x = 1; x <= maxPartitions[zoom]; x++) {

			var y = Math.floor(maxPartitions[zoom] / x);

			var delta_x = ( bbox[3] - bbox[1] ) / x;
			var delta_y = ( bbox[2] - bbox[0] ) / y;

			var area = delta_x * delta_y;

			if (area < minarea) {
				minarea = area;
				minx = x;
				miny = y;
			}
		}
	} catch (Err) {  /* no action */ }
	
	return ( {"minx" : minx, "miny": miny});
}


OpenLayers.Protocol.HTTP.prototype.read_custom = function(options, use_IE_workaround) {

	OpenLayers.Protocol.prototype.read.apply(this, arguments);
	options = options || {};
	options.params = OpenLayers.Util.applyDefaults(
			options.params, this.options.params);
	options = OpenLayers.Util.applyDefaults(options, this.options);
	if (options.filter && this.filterToParams) {
		options.params = this.filterToParams(
				options.filter, options.params
		);
	}

	if (options.params.data.indexOf("{{bbox}}") != -1) {
		
		var opt_partitions = optimize_partitions(options.params.bbox);
		
		var bbox_fragments_url = gen_query_string(options.params.data, _global_timeout, 
				                                  options.params.bbox, 
				                                  _global_seg_x != undefined ? _global_seg_x : opt_partitions["minx"],
				                                  _global_seg_y != undefined ? _global_seg_y : opt_partitions["miny"]); 
		options.params.data = bbox_fragments_url;
		options.params["bbox"] = undefined;
	}
	
	var _currentdate = new Date();
	_currentdate.setHours(0, 0, 0, 0);
	
	if (_global_date.getTime() < _currentdate.getTime()) {
		options.params.data = '[date:"'+ formatDate(
				_global_date,
				"{FullYear}-{Month:2}-{Date:2}T23:59:59Z")+'"]' + options.params.data;
	}

	if (use_IE_workaround == true) {
		var resp = new OpenLayers.Protocol.Response({requestType: "read"});
		resp.priv = OpenLayers.Request.GET_custom({
			url: options.url,
			callback: this.createCallback(this.handleRead, resp, options),
			params: options.params,
			headers: options.headers
		});
		return (resp);
	} else {
		var readWithPOST = (options.readWithPOST !== undefined) ?
				options.readWithPOST : this.readWithPOST;
		var resp = new OpenLayers.Protocol.Response({requestType: "read"});
		if(readWithPOST) {
			var headers = options.headers || {};
			headers["Content-Type"] = "application/x-www-form-urlencoded";
			resp.priv = OpenLayers.Request.POST({
				url: options.url,
				callback: this.createCallback(this.handleRead, resp, options),
				data: OpenLayers.Util.getParameterString(options.params),
				headers: headers
			});
		} else {
			resp.priv = OpenLayers.Request.GET({
				url: options.url,
				callback: this.createCallback(this.handleRead, resp, options),
				params: options.params,
				headers: options.headers
			});
		}
		return resp;

	}
};

OpenLayers.Util.extend(OpenLayers.Request, {
	GET_custom : function(config) {
		var xdr = new XDomainRequest();
		var request = new OpenLayers.Request.XMLHttpRequest();

		var url = OpenLayers.Util.urlAppend(config.url, 
				OpenLayers.Util.getParameterString(config.params || {}));

		var events = this.events;

		var self = this;

		xdr.open("get", url);
		xdr.onload = function () {

			// Fake XMLHttpRequest contents with XDomainRequest response
			// OpenLayers has absolutely no idea about XDomainRequest and depends
			// on XMLHttpRequest everywhere. Yes, it's ugly.
			request.responseText = xdr.responseText;
			request.status = 200;
			request.readyState = OpenLayers.Request.XMLHttpRequest.DONE;
			request.abort = xdr.abort;

			var proceed = events.triggerEvent( "complete",
					{request: request, config: config, requestUrl: url}
			);
			if(proceed !== false) {
				self.runCallbacks(
						{request: request, config: config, requestUrl: url}
				);
			}
		};
		xdr.onprogress = function(){ /* no action */ };
		xdr.ontimeout = function(){ /* no action */ };
		xdr.onerror = function () { 
            request.statusText = 'Unknown error occured';   // no more details available...
            request.readyState = OpenLayers.Request.XMLHttpRequest.DONE;
            request.status = 500;
			request.abort = xdr.abort;

			var proceed = events.triggerEvent( "complete",
					{request: request, config: config, requestUrl: url}
			);
			if(proceed !== false) {
				self.runCallbacks(
						{request: request, config: config, requestUrl: url}
				);
			}
           
		};             
		setTimeout(function() { xdr.send(); }, 0);

		return request;
	}
});




FormatOSMMaxheightMap = OpenLayers.Class(OpenLayers.Format.OSM, {

	initialize: function(strategy, featureFilter) {
		OpenLayers.Format.OSM.prototype.initialize.apply(this, []);

		var additional_layer_defaults = {
				'interestingTagsInclude': ['maxheight']
		};

		var interesting = {};
		for (var i = 0; i < additional_layer_defaults.interestingTagsInclude.length; i++) {
			interesting[additional_layer_defaults.interestingTagsInclude[i]] = true;
		}
		this.interestingTagsInclude = interesting;

		this.strategy = strategy;
		this.featureFilter = function(feature) {
			                       if ($.isArray(featureFilter)) {
			                    	  var result = feature;
			                    	  for (var f = 0; f < featureFilter.length; f++) {
			                    		 result = (featureFilter[f])(result); 
			                    	  }
			                    	  return result;
			                       } else
			                       return featureFilter(feature);
		                     };
		
		this.checkTags = true;    // implications: roundabout -> no longer polygon (see OSM::isWayArea)
		                          // if way contains node w/ maxheight=*, an additional node is created
	},

	read: function(doc) {
		
		var check_error_doc = doc;
		
		if (typeof check_error_doc == "string") {
			check_error_doc = OpenLayers.Format.XML.prototype.read.apply(this, [doc]);
		}		
		
		if (this.strategy) {
			var node_list = check_error_doc.getElementsByTagName("remark");
			if (node_list.length > 0) {
				$("#statusline").text(OpenLayers.i18n('zoomin'))
				                .css({ 'color': 'red', 'font-weight': 'bold' });
				this.strategy.bounds = null;
				return [];
			}
			
			var last_updated = undefined;
			
			try {
				var meta = check_error_doc.getElementsByTagName("meta");
				if (meta.length > 0 ) {
					last_updated = meta[0].getAttribute("osm_base");
					var ts_overpass = Date.parse(last_updated);
					var ts_own = new Date();
					var ts_delta = ts_own - ts_overpass;
					var delta_minutes = ts_delta/(1000*60);
					$('#overpass_lag').text(delta_minutes.toFixed(1));
				}
			} catch (Err) {  /* no action */ }

		}		
		
		var feat_list_ol = OpenLayers.Format.OSM.prototype.read.apply(this, [doc]);

		var feat_list = this.featureFilter (feat_list_ol);

		if (feat_list.length == 0) {
			this.strategy.layer.removeAllFeatures({silent: true});
			this.strategy.layer.map.updateStatusLine();
		}

		return feat_list;
	},
	// replace OpenLayers function with own (reverse) logic: 
	// use white listing to identify interesting tags
	getTags: function(dom_node, interesting_tags) {
		var tag_list = dom_node.getElementsByTagName("tag");
		var tags = {};
		var interesting = false;
		for (var j = 0; j < tag_list.length; j++) {
			var key = tag_list[j].getAttribute("k");
			tags[key] = tag_list[j].getAttribute("v");
			if (interesting_tags) {
				/* if (!this.interestingTagsExclude[key]) {
	                    interesting = true;
	                }	 */
				if (this.interestingTagsInclude[key]) {
					interesting = true;
				}
			}    
		}  
		return interesting_tags ? [tags, interesting] : tags;     
	},

	strategy: null,

	CLASS_NAME: "FormatOSMMaxheightMap"
});

function make_large_layer(server_url, data, description, styleMap, featureFilter, allowClustering, zoom) {
	
	var strategy = new ZoomLimitedBBOXStrategy({ async: false, zoom: zoom });

    var clusterStrategy = new OpenLayers.Strategy.MapLevelCluster({
        distance: 10,
        autoActivate: false
    });
    	
	var layer = new OpenLayers.Layer.Vector(description, {
		strategies: [strategy, clusterStrategy],
		protocol: new OpenLayers.Protocol.HTTP({
			url: server_url + 'interpreter',
			params: { "data": data },
			format: new FormatOSMMaxheightMap(strategy, featureFilter),
			headers: { "X-Requested-With": "maxheight map - created by mmd" },
			readWithPOST: true
		}),
		styleMap: styleMap,
		projection: new OpenLayers.Projection("EPSG:4326"),
		ratio: 1.0,
		rendererOptions: {zIndexing: true}
	});
	
	layer._zoom = zoom;

	if (_global_classicStyle && allowClustering)
		clusterStrategy.activate();
	else
		clusterStrategy.deactivate();

	layer.events.register("featuresadded", layer, function() { layer.map.updateStatusLine(); });

	return layer;
}

function make_layer(server_url, data, description, styleMap, featureFilter, allowClustering) {
	return make_large_layer(server_url, data, description, styleMap, featureFilter, allowClustering, 11);
}

