// Variable definitions
var map
var ndbc_sos = 'https://sdf.ndbc.noaa.gov/sos/server.php?request=GetCapabilities&service=SOS'
var local_sos= 'https://'
var GetCapabilitiesXML
var markerJSON
var stationCount
var markers = L.markerClusterGroup();

var map = L.map('map').setView([19.228825, 72.854110], 1.5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 10,
}).addTo(map);

function StringToXMLDom(string) {
  var xmlDoc = null;
  if (window.DOMParser) {
    parser = new DOMParser();
    xmlDoc = parser.parseFromString(string, "text/xml");
  } else {
    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async = "false";
    xmlDoc.loadXML(string);
  }
  return xmlDoc;
}

var co;

$.ajax({
  url: ndbc_sos,
  dataType: 'text',
  success: function(result) {
    // console.log(result);
    GetCapabilitiesXML=StringToXMLDom(result);

    // console.log(GetCapabilitiesXML)
    var capabilities = GetCapabilitiesXML.getElementsByTagName('sos:Capabilities')[0]
    // console.log(capabilities)
    var observationOfferingList = capabilities.children[3].children[0].children;
    // console.log(observationOfferingList)
    stationCount=observationOfferingList.length
    var stationCoordinates
    var stationDetails
    for (i = 1; i < stationCount; i++) {
      stationDetails=observationOfferingList[i].children[1].innerHTML;
      stationCoordinates=observationOfferingList[i].children[3].children[0].children[0].innerHTML.split(' ');
      var marker=L.marker([stationCoordinates[0], stationCoordinates[1]]);
      marker.bindPopup(stationDetails);
      markers.addLayer(marker);
      map.addLayer(markers);
    }

  },
  error: function(xhr, staus, error) {
    console.log('error in ajax', status, error);
  }
});
