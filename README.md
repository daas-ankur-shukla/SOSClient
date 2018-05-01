# SOSClient for NDBC Service

This project is a course project undertaken for GNR 629 Interoperability, Knowledge Discovery course under [Prof. S. Durbha](http://www.csre.iitb.ac.in/~sdurbha/) at [CSRE, IIT Bombay](http://www.csre.iitb.ac.in).
The project aims to develop a Sensor Observation Service for National Data Buoy Service using pure Javascript and Material UI.

The following features have been implemented in the client:

- Spatial Filtering: using leaflet draw plugin for drawing a bounding box to select stations.
- Temporal Filtering: for filtering stations based on the duration of their operation.
- Property Filtering: for filtering stations based on the reading they are capable of giving.
- All the above filters are capable of working in parallel, thus providing spatio-temporal-property fitlering simultaneously for enhanced filtering.
- Selected readings have also been visualized using Gaugejs library to render an animated gauge dynamically.
- Interactive tables and graphs have also been presented to the user for better visual understanding of the readings provide by the stations.

This repository is under development and has commits from [Ankur Shukla](https://github.com/daas-ankur-shukla/) & [Rajat Shinde](https://github.com/omshinde/)
