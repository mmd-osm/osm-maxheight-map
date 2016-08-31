Maxheight Map (aka OSM Truck QA Map)
====================================

Maxheight Map is an Overpass API-based browser tool which helps you check and improve truck relevant features in OpenStreetMap. Besides identifying missing maximum height tags under (railway) bridges and tunnels, you can also validate existing tagging for maximum height, width, length and weight amongst others.

[Wiki page](http://wiki.openstreetmap.org/wiki/Maxheight_Map)

Features
========

Intersection Check
------------------

Similar to PostGIS' st_crosses function Maxheight Map uses an adopted version of OpenLayers intersection method to determine intersections on inner points only. This is used to identify missing maxheight tags under bridges.



