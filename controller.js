// Variable definitions
var map
const ndbc_sos = 'https://sdf.ndbc.noaa.gov/sos/server.php?request=GetCapabilities&service=SOS'
const describeStationURL = 'https://sdf.ndbc.noaa.gov/sos/server.php?request=DescribeSensor&service=SOS&version=1.0.0&outputformat=text/xml;subtype=%22sensorML/1.0.1%22&procedure=urn:ioos:station:wmo:'
const local_sos = 'https://'
var GetCapabilitiesXML
var markerJSON
var stationCount
var stationArray = []
var stationGroups = L.markerClusterGroup({chunkedLoading: true});

const obsPropMap = {
  'sea_floor_depth_below_sea_surface': 'Sea Floor Depth Below Sea Surface',
  'air_pressure_at_sea_level': 'Air Pressure At Sea Level',
  'sea_water_temperature': 'Sea Water Temperature',
  'sea_water_salinity': 'Sea Water Salinity',
  'air_temperature': 'Air Temperature',
  'waves': 'Waves',
  'winds': 'Winds',
}

// create popup contents
// var customPopup = "Mozilla Toronto Offices<br/><img src='http://joshuafrazier.info/images/maptime.gif' alt='maptime logo gif' width='350px'/>";

// specify popup options
// const customOptions = {
//   'maxWidth': '1200',
//   'className' : 'customPopup'
// }


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
  return 'https://sdf.ndbc.noaa.gov/sos/server.php?request=GetObservation&service=SOS&version=1.0.0&offering=urn:ioos:station:wmo:' + id + '&observedproperty=' + property + '&responseformat=text/xml;subtype=\"om/1.0.0\"&eventtime=latest';
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



function getPropertyData(getObservationXML) {
  observedProperty = StringToXMLDom(getObservationXML);
  // console.log(getObservationXML)
}

function describeStation(stationXML, stationID, observedProps) {
  var props = [];
  for (var i = 0; i < observedProps.length; i++) {
    propName = observedProps[i].outerHTML.split('/').slice(-2, -1)[0].split('"')[0]
    // console.log(propName)
    observationURL = getObservationURL(stationID, propName)
    $.get(observationURL).done(function(data) {
      observedPropertyData = getPropertyData(data);

    });
    props.push('<tr><td width=\'15%\'><img src=\'./images/'+propName+'.png\' width=\'30\' height=\'30\' align=\'left\'/></td><td width=\'85%\'><a href=\'' + observationURL + '\' target=\'_blank\'>   ' + obsPropMap[propName] + '</a></td></tr>');
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
    var des = '<table style=\'width:100%\' border=\'0\'><tr><td><h1 style=\'font-size=50%;margin-top:0.5em;\'>NDBC</h1></td><td><img src=\'./images/ndbc_logo.png\' width=\'40\' height=\'40\' align=\'right\'></td></tr><tr><td colspan=\'2\'><h1>Station-'+stationID+'</h1></td></tr>' + props.join('\n')+'</table>';
    // var des = '<h1>Station-' + stationID + '</h1> <p>Hi, I am Station ' + stationID + '\nTo know more about me <a href=\'' + describeStationURL + stationID + '\' target=\'_blank\'>click here</a>,\n<p>To get my observations click on the respective links</a>' + '\n<ol>' + props.join('\n')+'</ol>';
    // var des = '<iframe src=\"http://www.ndbc.noaa.gov/widgets/station_page.php?station='+stationID+'\" style=\"border: solid thin #3366ff; width:300px; height:300px\"></iframe>'
    return des;
  } else {
    return '<p>Sorry, I am lost :('
  }
}

var co;

function spatialFiltering(state) {
  if(state) {

  }else {

  }
};

function temporalFiltering(state) {
  if(state) {

  }else {

  }
};

function propertyFiltering(state) {
  if(state) {

  }else {

  }
};


$('#spatialFilter').change(function() {
  if($('#spatialFilter').prop('checked')) {
    spatialFiltering(true);
  } else {
    spatialFiltering(false)
  }
});

$('#temporalFilter').change(function() {
  if($('#temporalFilter').prop('checked')) {
    temporalFiltering(true);
  } else {
    temporalFiltering(false)
  }
});

$('#propertyFilter').change(function() {
  if($('#propertyFilter').prop('checked')) {
    propertyFiltering(true);
  } else {
    propertyFiltering(false)
  }
});


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
      ], {
        stationID: stationID,
        observedProps: observationOfferingList[i].getElementsByTagName("sos:observedProperty"),
        enabled: true,
      });

      const popupHeading = '<p>Please wait, I am looking for my SensorML</p>'
      stationMarker.bindPopup(popupHeading);
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
