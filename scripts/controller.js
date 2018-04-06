// Variable definitions
var map
var ndbc_sos = 'https://sdf.ndbc.noaa.gov/sos/server.php?request=GetCapabilities&service=SOS'
var describeStationURL = 'https://sdf.ndbc.noaa.gov/sos/server.php?request=DescribeSensor&service=SOS&version=1.0.0&outputformat=text/xml;subtype=%22sensorML/1.0.1%22&procedure=urn:ioos:station:wmo:'
var local_sos = 'https://'
var GetCapabilitiesXML
var markerJSON
var stationCount
var stationArray = []
var stationGroups = L.markerClusterGroup({chunkedLoading: true});

var stationMarker
var map = L.map('map').setView([
  19.228825, 72.854110
], 1.5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 10
}).addTo(map);

function getObservationURL(id, property) {
  // console.log(property)
  return 'https://sdf.ndbc.noaa.gov/sos/server.php?request=GetObservation&service=SOS&version=1.0.0&offering=urn:ioos:station:wmo:'+id+'&observedproperty='+property+'&responseformat=text/xml;subtype=\"om/1.0.0\"&eventtime=latest';
}
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

function describeStation(stationXML, stationID, observedProps) {
  // var props = observedProps.map(function(prop){
  //   var propName = prop.outerHTML.split('/').pop()
  //   var observationURL = getObservationURL(propName)
  //   return '<a href=\''+observationURL+'\'>'+propName+'</a>'
  // })
  var props = [];
  for(var i=0;i<observedProps.length;i++){
    propName = observedProps[i].outerHTML.split('/').slice(-2, -1)[0].split('"')[0]
    // console.log(propName)
    observationURL = getObservationURL(stationID, propName)
    props.push('<a href=\''+observationURL+'\'>'+propName+'</a>');
  }
  // console.log(props)
  var stationInfo = stationXML.children[0].children[0].children[0].children;
  // console.log(stationInfo)
  if (stationInfo.length > 0) {
    var stationDes = {
      id: stationID,
      description: stationInfo[0].innerHTML,
      name: 'Station-' + stationID,
      beginTime: -1,
      endTIme: -1
    }
    if (stationInfo.length == 13) {
      stationDes['beginTime'] = stationInfo[5].children[0].children[0].innerHTML;
      stationDes['endTime'] = stationInfo[5].children[0].children[1].innerHTML;
    }
    // console.log(stationDes);
    // TODO: optimize next statement by rendering stationXML variable in new tab
    var des = '<h1>Station-' + stationID + '</h1> <p>Hi, I am Station ' + stationID + ',\n<p>To get my observations <a href=\'\' target=\'_blank\'>click here</a>\nand to know more about me <a href=\'' + describeStationURL + stationID + '\' target=\'_blank\'>click here</a>'+'\n'+props.join('\n')
    // var des = '<iframe src=\"http://www.ndbc.noaa.gov/widgets/station_page.php?station='+stationID+'\" style=\"border: solid thin #3366ff; width:300px; height:300px\"></iframe>'
    return des;
  } else {
    return '<p>Sorry, I am lost :('
  }
}

var co;

$.ajax({
  url: ndbc_sos,
  dataType: 'text',
  success: function(result) {
    // console.log(result);
    GetCapabilitiesXML = StringToXMLDom(result);

    // console.log(GetCapabilitiesXML)
    var capabilities = GetCapabilitiesXML.getElementsByTagName('sos:Capabilities')[0]
    // console.log(capabilities)
    var observationOfferingList = capabilities.children[3].children[0].children;
    // console.log(observationOfferingList)
    stationCount = observationOfferingList.length
    var stationCoordinates
    var stationDetails
    for (i = 1; i < stationCount; i++) {
      var stationHTML = '<p>Station Description: ' + observationOfferingList[i].children[0].innerHTML + '</p>';
      var stationID = observationOfferingList[i].children[1].innerHTML.split(':').pop()

      stationHTML += '<p>StationID: ' + stationID + '</p>';
      stationCoordinates = observationOfferingList[i].children[3].children[0].children[0].innerHTML.split(' ');

      stationMarker = L.marker([
        stationCoordinates[0], stationCoordinates[1]
      ], {stationID: stationID, observedProps: observationOfferingList[i].getElementsByTagName("sos:observedProperty")});

      stationMarker.bindPopup('<p>Please wait, I am looking for my SensorML</p>');
      stationMarker.on('click', function(e) {
        var id = this.options.stationID;
        var observedProps = this.options.observedProps
        var popup = e.target.getPopup();
        setTimeout(function() {
          // console.log(e.target, e.target.options.stationID)
          $.get(describeStationURL + id).done(function(data) {
            // console.log(data)
            stationData = describeStation(data, id, observedProps);
            popup.setContent(stationData);
            popup.update();
          });
          //your code to be executed after 1 second
        }, 150);

      })
      // stationArray.push({marker: stationMarker, id: i-1, detail: stationHTML});
      stationGroups.addLayer(stationMarker);
    }

    // console.log('adding to layer')
    map.addLayer(stationGroups);
  },
  error: function(xhr, staus, error) {
    console.log('error in ajax', status, error);
  }
});
