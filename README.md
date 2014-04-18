Maxheight Map (aka OSM Truck QA Map)
====================================

Maxheight Map is an Overpass API-based browser tool which helps you check and improve truck relevant features in OpenStreetMap. Besides identifying missing maximum height tags under (railway) bridges and tunnels, you can also validate existing tagging for maximum height, width, length and weight amongst others.

[Wiki page](http://wiki.openstreetmap.org/wiki/Maxheight_Map)

Features
========

Intersection Check
------------------

Similar to PostGIS' st_crosses function Maxheight Map uses an adopted version of OpenLayers intersection method to determine intersections on inner points only. This is used to identify missing maxheight tags under bridges.


Some tricks to improve performance
==================================

Memoization of sorted results
-----------------------------

OpenLayer's intersection checks repeatedly calls OpenLayers.Geometry.LineString.getSortedSegments with the same segments. We employ a memoization technique, i.e. cache a previous sorting result. 

On the fly BBOX splitting
-------------------------

Layers 'way below railway bridge' and 'way below bridge' depend on Overpass API's 'around' functionality with radius 0 for intersection checks. ''Around'' is quite CPU intensive as it needs to calcuate great circle distances on all relevant points in a bbox. A number of tests were conducted to analyse and improve response times. One interesting finding was that a larger bbox usually takes significantly more time than the same bbox split into smaller (slightly overlapping) bboxes. 
 

| Test/Size     |     1x1             |  2x2      |  3x3    |   4x4     |   8x8      |
| ------------- | ------------------: |---------: | ------: | --------: | ---------: |
| Bonn          |      8s             |   4s      |   4s    |    5s     |            |
| Koblenz       |     24s             |  12s      |   9s    |    9s     |            |
| XL            |   >5min (timeout)   | 123s      |  66s    |   47s     |  28s       |
| Saarbrücken   |     16s             |   8s      |   8s    |    6s     |   10s      |


Depending on the zoom level and screen resolution Maxheight Map will automatically break down a large bbox into smaller chunks and collect the results in a single Overpass API request.


Layer merging 
-------------

If two layers 'way below railway bridge' and 'way below bridge' are both selected, they will be meged to one virtual layer, resulting in only one Overpass API request.

