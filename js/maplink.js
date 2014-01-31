//--------------------------------------------------------------------------------
//	$Id: maplink.js,v 1.6 2012/02/16 18:31:56 wolf Exp wolf $
//--------------------------------------------------------------------------------
//	Erklaerung:	http://www.netzwolf.info/kartografie/openlayers/maplink
//--------------------------------------------------------------------------------
//	Fragen, Wuensche, Bedenken, Anregungen?
//	<openlayers(%40)netzwolf.info>
//--------------------------------------------------------------------------------

OpenLayers.Control.Maplink=OpenLayers.Class(OpenLayers.Control.Permalink,{

	displayClass: "olControlMaplink",
	label: null,
	target: null,

	initialize:function(element,base,options) {
		if (!base) base = "http://www.openstreetmap.org";
		OpenLayers.Control.Permalink.prototype.initialize.apply (this,[element,base,options]);
	},

	updateLink: function() {
		var params;
		var bounds = undefined;

		switch (this.format) {
		case "trbl":
			bounds = this.map.calculateBounds();
			if (!bounds) return;
			bounds = bounds.transform(this.map.getProjectionObject(), this.map.displayProjection);
			params = {top: bounds.top, right: bounds.right, bottom: bounds.bottom, left: bounds.left};
			break;
		default:
			params = this.createParams();
			if (params) delete params['layers'];
			break;
		}
		/*
		this.element.href=this.base
			+ (this.base.indexOf('?')==-1 ? '?' : '&')
			+ OpenLayers.Util.getParameterString(params);
	    */
		this.element.href = (this.base.indexOf('?')==-1 ? this.base :
			                 this.base.substring(0,this.base.indexOf('?')))
			                + '?' 
			                + OpenLayers.Util.getParameterString(params);

		if (this.bounds) {
			if (!bounds) {
				bounds = this.map.calculateBounds();
				if (bounds)
				bounds = bounds.transform(this.map.getProjectionObject(), this.map.displayProjection);
			}
			var intersect = bounds &&
				this.bounds.left  < bounds.right &&
				this.bounds.right > bounds.left  &&
				this.bounds.bottom< bounds.top   &&
				this.bounds.top   > bounds.bottom;
			this.div.style.display = intersect ? null : 'none';
		}
	},

	draw:function() {
		OpenLayers.Control.Permalink.prototype.draw.apply(this,arguments);
		this.div.className=this.displayClass;
		if (this.label) this.element.innerHTML=this.label;
		if (!this.element.innerHTML) this.element.innerHTML="Maplink";
		if (this.target) this.element.target=this.target;
		if (this.id) this.div.id=this.id;
		return this.div;
	},

	CLASS_NAME:"OpenLayers.Control.Maplink"
});

//--------------------------------------------------------------------------------
//	$Id: maplink.js,v 1.6 2012/02/16 18:31:56 wolf Exp wolf $
//--------------------------------------------------------------------------------
