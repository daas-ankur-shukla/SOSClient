// Variable definitions
var map
const ndbc_sos = 'https://sdf.ndbc.noaa.gov/sos/server.php?request=GetCapabilities&service=SOS'
const describeStationURL = 'https://sdf.ndbc.noaa.gov/sos/server.php?request=DescribeSensor&service=SOS&version=1.0.0&outputformat=text/xml;subtype=%22sensorML/1.0.1%22&procedure=urn:ioos:station:wmo:'
const local_sos = 'https://'
var GetCapabilitiesXML
var markerJSON
var stationCount
var stationArray = [];

var spatialGroup = L.markerClusterGroup();
var temporalGroup = L.markerClusterGroup();
var propGroup = L.markerClusterGroup();

var stationGroups = L.markerClusterGroup({
  chunkedLoading: true,
  iconCreateFunction: function(cluster) {
    var markers = cluster.getAllChildMarkers();
    var c = ' marker-cluster-';
    var childCount = 0;
    for (var i = 0; i < markers.length; i++) {
      if (markers[i].options.enabled) {
        childCount++;
      }
    }
    if (childCount < 10) {
      c += 'small';
    } else if (childCount < 100) {
      c += 'medium';
    } else {
      c += 'large';
    }
    return new L.DivIcon({
      html: '<div><span>' + childCount + '</span></div>',
      className: 'marker-cluster' + c,
      iconSize: new L.Point(40, 40)
    });
  }
});
// var stationGroups = L.markerClusterGroup({chunkedLoading: true});
var minDate = '';
var maxDate = '';

const obsPropMap = {
  'sea_floor_depth_below_sea_surface': 'Sea Floor Depth Below Sea Surface',
  'air_pressure_at_sea_level': 'Air Pressure At Sea Level',
  'sea_water_temperature': 'Sea Water Temperature',
  'sea_water_salinity': 'Sea Water Salinity',
  'air_temperature': 'Air Temperature',
  'currents': 'Currents',
  'waves': 'Waves',
  'winds': 'Winds'
}

function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

// create popup contents
// var customPopup = "Mozilla Toronto Offices<br/><img src='http://joshuafrazier.info/images/maptime.gif' alt='maptime logo gif' width='350px'/>";

// specify popup options
// const customOptions = {
//   'maxWidth': '1200',
//   'className' : 'customPopup'
// }

var stationMarker
var map = L.map('map', {minZoom: 1}).setView([
  19.228825, 72.854110
], 1.5);

var OSMLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 10
});

map.addLayer(OSMLayer);

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

function getProperties(observedProps) {
  var props = [];
  for (var i = 0; i < observedProps.length; i++) {
    propName = observedProps[i].outerHTML.split('/').slice(-2, -1)[0].split('"')[0]
    // console.log(propName);
    props.push(propName);
  }
  // console.log(props);
  return props;
}

function describeStation(stationXML, stationID, propList) {
  var props = [];
  // console.log(propList, propList.length)
  for (var i = 0; i < propList.length; i++) {
    // propName = observedProps[i].outerHTML.split('/').slice(-2, -1)[0].split('"')[0]
    // console.log(propList[i])
    observationURL = getObservationURL(stationID, propList[i])
    $.get(observationURL).done(function(data) {
      observedPropertyData = getPropertyData(data);

    });
    props.push('<tr><td width=\'15%\'><img src=\'./images/' + propList[i] + '.png\' width=\'30\' height=\'30\' align=\'left\'/></td><td width=\'85%\'><a href=\'' + observationURL + '\' target=\'_blank\'>   ' + obsPropMap[propList[i]] + '</a></td></tr>');
  }
  // console.log(props)
  var stationInfo = stationXML.children[0].children[0].children[0].children;
  // console.log(stationInfo)
  if (stationInfo.length > 0) {
    var des = '<table style=\'width:100%\' border=\'0\'><tr><td><h1 style=\'font-size=50%;margin-top:0.5em;\'>NDBC</h1></td><td><img src=\'./images/ndbc_logo.png\' width=\'40\' height=\'40\' align=\'right\'></td></tr><tr><td colspan=\'2\'><h1>Station-' + stationID + '</h1></td></tr>' + props.join('\n') + '</table>';
    // var des = '<h1>Station-' + stationID + '</h1> <p>Hi, I am Station ' + stationID + '\nTo know more about me <a href=\'' + describeStationURL + stationID + '\' target=\'_blank\'>click here</a>,\n<p>To get my observations click on the respective links</a>' + '\n<ol>' + props.join('\n')+'</ol>';
    // var des = '<iframe src=\"http://www.ndbc.noaa.gov/widgets/station_page.php?station='+stationID+'\" style=\"border: solid thin #3366ff; width:300px; height:300px\"></iframe>'
    return des;
  } else {
    return '<p>Sorry, I am lost :('
  }
}

var co;

function refreshDisplay() {
  for(var i=0;i<stationCount-1;i++) {
    // console.log(isInArray(stationArray[i].marker,spatialArray), isInArray(stationArray[i].marker,temporalArray), isInArray(stationArray[i].marker,propArray));
    if(spatialGroup.hasLayer(stationArray[i].marker) && temporalGroup.hasLayer(stationArray[i].marker) && propGroup.hasLayer(stationArray[i].marker)) {
      if(!stationGroups.hasLayer(stationArray[i].marker)) {
        stationGroups.addLayer(stationArray[i].marker);
        stationGroups.refreshClusters();
      }
    }else {
      if(stationGroups.hasLayer(stationArray[i].marker)) {
        stationGroups.removeLayer(stationArray[i].marker);
        stationGroups.refreshClusters();
      }
    }
  }
  stationGroups.refreshClusters();
};

function resetMarkers() {
  for (i = 0; i < stationCount - 1; i++) {
    stationArray[i].marker.options.enabled = true;
    if (!stationGroups.hasLayer(stationArray[i].marker)) {
      stationGroups.addLayer(stationArray[i].marker);
    }
  }
  stationGroups.refreshClusters();
}

var bb;
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
var drawControl = new L.Control.Draw({
  draw: {
    rect: {
      shapeOptions: {
        color: 'green'
      }
    },
    circle: false,
    polyline: false,
    polygon: false,
    marker: false
  },
  edit: {
    featureGroup: drawnItems,
    remove: false
  }
});
map.addControl(drawControl);
map.on('draw:created', function(e) {
  var type = e.layerType,
    layer = e.layer;
  if (type === 'rectangle') {
    // layer.on('mouseover', function() {
    //   bb = layer.getLatLngs();
    //   var currBb = document.getElementById("bb");
    //   console.log(bb[0]);
    //   // currBb.innerHTML = "<br><br>&nbsp;&nbsp;Bounding Box: (Lat, Lon)<br>&nbsp;&nbsp;LL: (" + bb[0][0].lat + ", " + bb[0][0].lng + "),<br>&nbsp;&nbsp;UL: (" + bb[0][1].lat + ", " + bb[0][1].lng + "),<br>&nbsp;&nbsp;UR: (" + bb[0][2].lat + ", " + bb[0][2].lng + "),<br>&nbsp;&nbsp;LR: (" + bb[0][3].lat + ", " + bb[0][3].lng + ")";
    //   console.log(bb);
    // });
    bb = layer.getLatLngs();
    var currBb = document.getElementById("bb");
    // console.log(bb);
    // Code for Spatial Filter
    for (var i = 0; i < stationCount - 1; i++) {
      latlong = [stationArray[i].marker.getLatLng()];
      if (!(latlong[0].lat < bb[0][1].lat && latlong[0].lng > bb[0][1].lng && latlong[0].lat > bb[0][3].lat && latlong[0].lng < bb[0][3].lng)) {
        // stationArray[i].marker.options.enabled = false;
        spatialGroup.removeLayer(stationArray[i].marker);
      } else {
        // stationArray[i].marker.options.enabled = true;
        spatialGroup.addLayer(stationArray[i].marker);
      }
    }
    refreshDisplay();
  }
  drawnItems.addLayer(layer);
});

L.Control.RemoveAll = L.Control.extend({
  options: {
    position: 'topleft'
  },
  onAdd: function(map) {
    var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
    L.DomEvent.addListener(controlDiv, 'click', L.DomEvent.stopPropagation).addListener(controlDiv, 'click', L.DomEvent.preventDefault).addListener(controlDiv, 'click', function() {
      drawnItems.clearLayers();
    for(var i=0;i<stationCount-1;i++) {
      if(!spatialGroup.hasLayer(stationArray[i].marker)) {
        spatialGroup.addLayer(stationArray[i].marker);
      }
    }
    refreshDisplay();
    });
    var controlUI = L.DomUtil.create('a', 'leaflet-draw-edit-remove', controlDiv);
    controlUI.title = 'Remove All Polygons';
    controlUI.href = '#';
    return controlDiv;
  }
});
var removeAllControl = new L.Control.RemoveAll();
map.addControl(removeAllControl);

// L.Control.PropChange = L.Control.extend({
//   options: {
//     position: 'bottomleft'
//   },
//   onAdd: function(map) {
//     var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
//     L.DomEvent.addListener(controlDiv, 'click', L.DomEvent.stopPropagation).addListener(controlDiv, 'click', L.DomEvent.preventDefault).addListener(controlDiv, 'click', function() {
//       drawnItems.clearLayers();
//       resetMarkers();
//     });
//     var controlUI = L.DomUtil.create('a', 'leaflet-draw-edit-remove', controlDiv);
//     controlUI.title = 'Remove All Polygons';
//     controlUI.href = '#';
//     return controlDiv;
//   }
// });
// var PropChangeFilter = new L.Control.PropChange();
// map.addControl(PropChangeFilter);

L.Control.TemporalControl = L.Control.extend({
  options: {
    // topright, topleft, bottomleft, bottomright
    position: 'topright',
    minValue: "",
    maxValue: "",
    layer: null,
    range: false,
    min: 0,
    max: -1
  },
  initialize: function(options) {
    // constructor
    // console.log('slider init called');
    // console.log(this.options);
    L.Util.setOptions(this, options);
    // console.log(this.options);
  },

  setPosition: function(position) {
    // console.log('setposition called')
    var map = this._map;

    if (map) {
      map.removeControl(this);
    }

    this.options.position = position;

    if (map) {
      map.addControl(this);
    }
    this.startSlider();
    return this;
  },

  onAdd: function(map) {
    var sliderContainer = L.DomUtil.create('div', 'slider', this._container);
    $(sliderContainer).append('<div id="leaflet-slider" style="width:200px"><div class="ui-slider-handle"></div><div id="slider-timestamp" style="width:200px; margin-top:10px;background-color:#FFFFFF"></div></div>');
    $(sliderContainer).mousedown(function() {
      map.dragging.disable();
    });
    $(document).mouseup(function() {
      map.dragging.enable();
      $('#slider-timestamp').html('');
    });

    return sliderContainer;
  },

  onRemove: function(map) {
    resetMarkers();
    $('#leaflet-slider').remove();
  },

  startSlider: function() {
    // console.log('startslider')
    _options = this.options;
    $("#leaflet-slider").slider({
      range: _options.range,
      values: [
        0,
        _options.maxValue.diff(_options.minValue, 'days')
      ],
      min: _options.min,
      max: _options.max,
      step: 1,
      stop: function(e, ui) {
        var map = _options.map;
        var low = ui.values[0];
        var high = ui.values[1];
        // console.log(low, high);
        // console.log(low==_options.min && high==_options.max)
        if (low == _options.min && high == _options.max) {
          // console.log('resetting')
          for(var i=0;i<stationCount-1;i++) {
            if(!temporalGroup.hasLayer(stationArray[i].marker)) {
              temporalGroup.addLayer(stationArray[i].marker);
            }
          }
          refreshDisplay();
        } else {
          var dateValMin = _options.minValue.add(low, 'days');
          var dateValMax = _options.maxValue.subtract(high, 'days');
          // console.log(dateValMin,dateValMax);
          for (i = 0; i < stationCount - 1; i++) {
            if (!(stationArray[i].marker.options.beginTime > dateValMin && stationArray[i].marker.options.endTime < dateValMax)) {
              // stationArray[i].marker.options.enabled = false;
              temporalGroup.removeLayer(stationArray[i].marker);
            } else {
              temporalGroup.addLayer(stationArray[i].marker);
            }
          }
          refreshDisplay();
        }
      }
    });
  }

});

//  Simple function based on stationArray

// function propertyFiltering(prop) {
//   if(prop!='RESET') {
//     for(i=0;i<stationCount-1;i++) {
//       if(!isInArray(prop,stationArray[i].marker.options.observedProps)) {
//         stationGroups.removeLayer(stationArray[i].marker);
//         stationGroups.refreshClusters();
//       }else {
//         if(!stationGroups.hasLayer(stationArray[i].marker)) {
//           stationGroups.addLayer(stationArray[i].marker);
//           stationGroups.refreshClusters();
//         }
//       }
//     }
//   }else {
//     resetMarkers();
//     stationGroups.refreshClusters();
//   }
// };

// Function based on enabled property
function propertyFiltering(prop) {
  if (prop != 'RESET') {
    for (i = 0; i < stationCount - 1; i++) {
      if (!isInArray(prop, stationArray[i].marker.options.observedProps)) {
        // stationArray[i].marker.options.enabled = false;
        propGroup.removeLayer(stationArray[i].marker);
      } else {
        propGroup.addLayer(stationArray[i].marker);
      }
    }
  } else {
    for (i = 0; i < stationCount - 1; i++) {
      propGroup.addLayer(stationArray[i].marker);
    }
  }
  refreshDisplay();
};

$('#propSelect').on('change', function() {
  propertyFiltering($('#propSelect').val())
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
    var stationCoordinates;
    var stationDetails;
    for (i = 1; i < stationCount; i++) {
      var stationHTML = '<p>Station Description: ' + observationOfferingList[i].children[0].innerHTML + '</p>';
      var stationID = observationOfferingList[i].children[1].innerHTML.split(':').pop()

      stationHTML += '<p>StationID: ' + stationID + '</p>';
      stationCoordinates = observationOfferingList[i].children[3].children[0].children[0].innerHTML.split(' ');

      stationMarker = L.marker([
        stationCoordinates[0], stationCoordinates[1]
      ], {
        stationID: stationID,
        observedProps: getProperties(observationOfferingList[i].getElementsByTagName("sos:observedProperty")),
        observedPropsXML: observationOfferingList[i].getElementsByTagName("sos:observedProperty"),
        beginTime: moment(observationOfferingList[i].getElementsByTagName("gml:beginPosition")[0].innerHTML),
        endTime: moment(observationOfferingList[i].getElementsByTagName("gml:endPosition")[0].innerHTML),
        enabled: true
      });

      // console.log(moment(observationOfferingList[i].getElementsByTagName("gml:beginPosition")[0].innerHTML).subtract(1,'day'))
      if (minDate == '' || moment(observationOfferingList[i].getElementsByTagName("gml:beginPosition")[0].innerHTML) < minDate)
        minDate = moment(observationOfferingList[i].getElementsByTagName("gml:beginPosition")[0].innerHTML)
        // if(maxDate == '' || moment(observationOfferingList[i].getElementsByTagName("gml:endPosition")[0].innerHTML)>minDate) minDate = moment(observationOfferingList[i].getElementsByTagName("gml:endPosition")[0].innerHTML)
      const popupHeading = '<p>Please wait, I am looking for my SensorML</p>'
      stationMarker.bindPopup(popupHeading);
      stationMarker.on('click', function(e) {
        // console.log(e.target.options.beginTime, e.target.options.endTime);
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
          //your code to be executed after 0.15 second
        }, 150);

      })
      stationArray.push({
        marker: stationMarker
      });
      spatialGroup.addLayer(stationMarker);
      temporalGroup.addLayer(stationMarker);
      propGroup.addLayer(stationMarker);
      // stationGroups.addLayer(stationMarker);
    }
    maxDate = moment();
    map.addLayer(stationGroups);
    refreshDisplay();

    L.control.temporalController = function(id, options) {
      return new L.Control.TemporalControl(id, options);
    }

    var sliderControl = L.control.temporalController({
      // topright, topleft, bottomleft, bottomright
      position: 'topright',
      minValue: minDate,
      maxValue: maxDate,
      layer: OSMLayer,
      range: true,
      min: 0,
      max: maxDate.diff(minDate, 'days')
    });
    // console.log('adding slider')
    map.addControl(sliderControl);

    sliderControl.startSlider();
  },
  error: function(xhr, staus, error) {
    console.log('error in ajax', status, error);
  }
});
