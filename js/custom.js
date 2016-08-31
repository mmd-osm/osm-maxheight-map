
var cache = {};

$(document).ready(
		function() {
			
			$("#hiddenIframe")[0].src = "";
			$("#tabs").tabs({
				collapsible : true
			});
			
			$( "#track" ).button({icons: {secondary: 'ui-icon-signal-diag', primary: null}}); 
			$( "#track" ).prop('checked', false);
			
			$( "#track" ).button("refresh");
			$( "#locate").button();
			
			$( "#export_gpx").button();
									
			$( "#datepicker" ).datepicker({ 
				
				minDate: (getParam("server") == "9" ? new Date(2007, 1 - 1, 1) : new Date(2012, 9 - 1, 1)), 
				maxDate: "+0D",
				changeMonth: true,
				changeYear: true,
				showButtonPanel: true,
				onSelect: function(dateText) { 
				    $(this).change();
				  }
			});
			
			$( "#datepicker" ).datepicker( "option", "dateFormat", 'yy-mm-dd' );
			
			$('#datepicker').change(function() { 
				var current_date = $("#datepicker").datepicker( 'getDate' );
			    current_date.setHours(0, 0, 0, 0);
				_global_date = current_date;
				var visibleLayers = window.map.getLayersBy("visibility", true);
				for (var i = 0; i < visibleLayers.length; i++) {
					var v = visibleLayers[i];
					if (v.features!=undefined) {
						v.removeAllFeatures();
						v.refresh({force:true});
					}
						   
				}
			});
			
			function update_datepicker(diff) {
				
				var date = $("#datepicker").datepicker( 'getDate' );
				
				switch (diff) {
				case -3: date.setMonth(date.getMonth() -1); break;
				case -2: date.setDate(date.getDate() - 7); break;
				case -1: date.setDate(date.getDate() - 1); break;
				case  1: date.setDate(date.getDate() + 1); break;
				case  2: date.setDate(date.getDate() + 7); break;
				case  3: date.setMonth(date.getMonth() +1 ); break;
				}
				
				$("#datepicker").datepicker( "setDate", date).change();
			}
			
			$( "#monthminus").button().click( function() { update_datepicker(-3); });
			$( "#weekminus").button() .click( function() { update_datepicker(-2); });
			$( "#dayminus").button()  .click( function() { update_datepicker(-1); });
			
			$( "#monthplus").button() .click( function() { update_datepicker(+3); });
			$( "#weekplus").button()  .click( function() { update_datepicker(+2); });
			$( "#dayplus").button()   .click( function() { update_datepicker(+1); });
			
			$('.buttonaligngroup').width(75);			
			
			if (window.innerWidth >= 800) {
			  layoutSettings["west"]["initClosed"] = false;
			  layoutSettings["east"]["initClosed"] = false;
			} else {
			  layoutSettings["defaults"]["minSize"] = 32;
			}
									
			myLayout = $('body').layout(layoutSettings);
			myLayout.addCloseBtn("#west-closer", "west");
			myLayout.addCloseBtn("#east-closer", "east");
			myLayout.panes.south = false;

			$('.widgetheader').find(".ui-icon-minusthick").click(
					function() {
						$(this).toggleClass("ui-icon-minusthick").toggleClass(
						"ui-icon-plusthick");
						$(this).parents(".widget-container:first").find(
						".widgetcontent").toggle("fast");
					});
			
			initMap('map');

			$("#search").keypress(function(e) {
				if(e.which == 13) {
					$("#search").autocomplete("search", $("#search").val() );
				}
			});

			$("#search").autocomplete({
				source: function ( request, response ) {


					function _success(data) {

						var mmd = $.map( data, function( item ) {

							var shortname = item.display_name;

							return {
								label: shortname,
								value: shortname,
								lat: item.lat,
								lon: item.lon,
								bbox: item.boundingbox,
								icon: (item.icon != undefined ? item.icon : "images/empty.png")
							};
						});
						cache[term] = mmd;
						response (mmd);
					}


					var term = request.term;
					if (term in cache) {
						response(cache[term]);
						return;
					}
					if ($.browser.msie && window.XDomainRequest) {
						// Use Microsoft XDR
						var xdr = new XDomainRequest();
						xdr.open("get", "http://nominatim.openstreetmap.org/" + 
								"search?format=json&q=" + encodeURI(term) + "&bounded=1&limit=8&" + 
								"addressdetails=1&polygon=0&" + 
//								"countrycodes=DE" + 
								"&_=" + new Date().getTime());
						xdr.onload = function () {
							var JSON = $.parseJSON(xdr.responseText);
							if (JSON == null || typeof (JSON) == 'undefined')    {
								JSON = $.parseJSON(data.firstChild.textContent);
							}
							_success (JSON);
						};
						xdr.onprogress = function(){ /* no action */ };
						xdr.ontimeout = function(){ /* no action */ };
						xdr.onerror = function () { /* no action */ };
						setTimeout(function() { xdr.send(); }, 0);
					} 
					else {

						$.ajax({
							url: "http://nominatim.openstreetmap.org/search",
							dataType: 'json',
							cache: false,
							data: {
								format: "json",
								q: request.term,
								bounded: 1,
								limit: 8,
								addressdetails: 1,
								polygon: 0
//								countrycodes: "DE"
							},
							error: function(xhr, status, errorThrown) {
								jqAlert(errorThrown+'\n'+status+'\n'+xhr.statusText, function() { /* no action */ });
							},
							success: _success

						});
					}

				},
				highlight: false,
				minLength: 2,
				delay: 800,
				select: function ( event, ui ) {

					var point1 = new OpenLayers.Geometry.Point(ui.item.bbox[3], ui.item.bbox[1]);
					point1.transform(epsg4326, map.getProjectionObject()); 

					var point2 = new OpenLayers.Geometry.Point(ui.item.bbox[2], ui.item.bbox[0]);
					point2.transform(epsg4326, map.getProjectionObject()); 

					var bounds = new OpenLayers.Bounds();
					bounds.extend(point1);
					bounds.extend(point2);
					bounds.toBBOX(); 

					map.zoomToExtent(bounds);
					

				},
				open: function () {
					$('.ui-autocomplete').css('font-size','10px');
					$('.ui-autocomplete').css('width','355px');
					$( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top");
				},
				close: function () {
					$( this ).removeClass( "ui-corner-top").addClass("ui-corner-all");
					$('#search').data().autocomplete.term = null;
//					$('#search').val("");
				}
			})
			.data('autocomplete')._renderItem = function (ul, item) {
				return $("<li />")
				.data("item.autocomplete", item)
				.append(item.icon != undefined ? '<a><table style="table-layout: fixed; width: 100%;"><tr>' + 
						'<td style="width: 30px;"><img src="' + item.icon + '" /></td>' + 
						'<td style="word-wrap: break-word">' + item.value + '</td></tr></table></a>' : item.value)
				.appendTo(ul);
			};


			$('#loading').fadeOut(function() {
				$(this).remove();
				$('body').removeClass('bodyload');
			});
		});

var layoutSettings = {
	name : "clientLayout",
	defaults : {
		size : "auto",
		minSize : 50,
		contentIgnoreSelector : "span",
		togglerLength_open : 35,
		togglerLength_closed : 35,
		hideTogglerOnSlide : true,
		togglerTip_open : "Close This Pane",
		togglerTip_closed : "Open This Pane",
		resizerTip : "Resize This Pane"
	},
	north : {
		spacing_open : 1,
		togglerLength_open : 0,
		togglerLength_closed : 35,
		resizable : false,
		slidable : false,
		fxName : "none"
	},
	west : {
		size : 250,
		spacing_closed : 21,
		togglerLength_closed : 21,
		togglerAlign_closed : "top",
		togglerLength_open : 0,
		togglerTip_open : "Close West Pane",
		togglerTip_closed : "Open West Pane",
		resizerTip_open : "Resize West Pane",
		slideTrigger_open : "click",
		initClosed : true,
		fxName : "drop",
		fxSpeed : "normal",
		fxSettings : {
			easing : ""
		}
	},
	east : {
		size : 220,
		spacing_closed : 21,
		togglerLength_closed : 21,
		togglerAlign_closed : "top",
		togglerLength_open : 0,
		togglerTip_open : "Close East Pane",
		togglerTip_closed : "Open East Pane",
		resizerTip_open : "Resize East Pane",
		slideTrigger_open : "click",
		initClosed : true,
		fxName : "drop",
		fxSpeed : "normal",
		fxSettings : {
			easing : ""
		}
	},
	south : {
		maxSize : 100,
		minSize : 0,
		spacing_closed : 0,
		slidable : false,
		initClosed : true,
		togglerLength_open : 0
	},
	center : {
		minWidth : 200,
		minHeight : 200,
		onresize : "map.updateSize()"
	}
};
