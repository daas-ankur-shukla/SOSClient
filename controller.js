// Variable definitions
var map
const ndbc_sos = 'https://sdf.ndbc.noaa.gov/sos/server.php?request=GetCapabilities&service=SOS'
const describeStationURL = 'https://sdf.ndbc.noaa.gov/sos/server.php?request=DescribeSensor&service=SOS&version=1.0.0&outputformat=text/xml;subtype=%22sensorML/1.0.1%22&procedure=urn:ioos:station:wmo:'
const local_sos = 'https://'
var GetCapabilitiesXML
var markerJSON
var stationCount
var stationArray = [];

var boundedStations = L.markerClusterGroup();
var spatialGroup = L.markerClusterGroup();
var temporalGroup = L.markerClusterGroup();
var propGroup = L.markerClusterGroup();
var gaugeOptions = {
  angle: 0.15, // The span of the gauge arc
  lineWidth: 0.44, // The line thickness
  radiusScale: 1, // Relative radius
  pointer: {
    length: 0.6, // // Relative to gauge radius
    strokeWidth: 0.035, // The thickness
    color: '#000000' // Fill color
  },
  limitMax: false, // If false, max value increases automatically if value > maxValue
  limitMin: false, // If true, the min value of the gauge will be fixed
  colorStart: '#6FADCF', // Colors
  colorStop: '#8FC0DA', // just experiment with them
  strokeColor: '#E0E0E0', // to see which ones work best for you
  generateGradient: true,
  highDpiSupport: true, // High resolution support
  staticLabels: {
    font: "10px sans-serif", // Specifies font
    labels: [], // Print labels at these values
    color: "#000000", // Optional: Label text color
    fractionDigits: 0 // Optional: Numerical precision. 0=round off.
  }
};

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
  'winds': 'Winds',
  'sea_surface_wave_significant_height': 'Sea Surface Wave Significant Height',
  'sea_surface_wave_peak_period': 'Sea Surface Wave Peak Period',
  'sea_surface_wave_mean_period': 'Sea Surface Wave Mean Period',
  'sea_surface_swell_wave_significant_height': 'Sea Surface Swell Wave Significant Height',
  'sea_surface_swell_wave_period': 'Sea Surface Swell Wave Period',
  'sea_surface_wind_wave_significant_height': 'Sea Surface Wind Wave Significant Height',
  'sea_surface_wind_wave_period': 'Sea Surface Wind Wave Period',
  'sea_water_temperature': 'Sea Water Temperature',
  'sea_surface_wave_to_direction': 'Sea Surface Wave To Direction',
  'sea_surface_swell_wave_to_direction': 'Sea Surface Swell Wave To Direction',
  'sea_surface_wind_wave_to_direction': 'Sea Surface Wind Wave To Direction',
  'center_frequency': 'Center Frequency',
  'bandwidth': 'Bandwidth',
  'spectral_energy': 'Spectral Energy',
  'mean_wave_direction': 'Mean Wave Direction',
  'principal_wave_direction': 'Principal Wave Direcion',
  'polar_coordinate_r1': 'Polar Coordinate R1',
  'polar_coordinate_r2': 'Polar Coordinate R2',
  'wind_from_direction': 'Wind From Direction',
  'wind_speed': 'Wind Speed',
  'wind_speed_of_gust': 'Wind Speed Of Gust',
  'direction_of_sea_water_velocity': 'Direction Of Sea Water Velocity',
  'sea_water_speed': 'Sea Water Speed',
  'upward_sea_water_velocity': 'Upward Sea Water Velocity',
  'error_velocity': 'Error Velocity',
  'platform_orientation': 'Platform Orientation',
  'platform_pitch_angle': 'Platform Pitch Angle',
  'platform_roll_angle': 'Platform Roll Angle',
  'sea_water_temperature': 'Sea Water Temperature',
  'pct_good_3_beam': 'PCT Good 3 Beam',
  'pct_good_4_beam': 'PCT Good 4 Beam',
  'pct_rejected': 'PCT Rejected',
  'pct_bad': 'PCT Band',
  'echo_intensity_beam1': 'Echo Intesity Beam1',
  'echo_intensity_beam2': 'Echo Intesity Beam2',
  'echo_intensity_beam3': 'Echo Intesity Beam3',
  'echo_intensity_beam4': 'Echo Intesity Beam4',
  'correlation_maginitude_beam1': 'Correlation Magnitude Beam1',
  'correlation_maginitude_beam2': 'Correlation Magnitude Beam2',
  'correlation_maginitude_beam3': 'Correlation Magnitude Beam3',
  'correlation_maginitude_beam4': 'Correlation Magnitude Beam4',
  'quality_flags': 'Qualitu Flags'
};

const subPropArray = [
  'sea_floor_depth_below_sea_surface',
  'air_pressure_at_sea_level',
  'sea_water_temperature',
  'sea_water_salinity',
  'air_temperature',
  'sea_water_speed',
  'sea_surface_wind_wave_significant_height',
  'wind_speed'
];

const subPropRange = {
  'sea_floor_depth_below_sea_surface': [
    0, 10994, 'Meters'
  ],
  'air_pressure_at_sea_level': [
    337, 1079, 'hPa'
  ],
  'sea_water_temperature': [
    -2.6, 40, 'C'
  ],
  'sea_water_salinity': [
    31, 38, 'g/kg'
  ],
  'air_temperature': [
    -5, 50, 'C'
  ],
  'sea_water_speed': [
    0, 1500, 'm/s'
  ],
  'sea_surface_wind_wave_significant_height': [
    0, 20.1, 'Meters'
  ],
  'wind_speed': [0, 54, 'km/h']
};

const sensorTypeMap = {
  'tsunameter0': 'Tsunameter',
  'baro1': 'Barometer',
  'watertemp1': 'Water Temperature',
  'airtemp1': 'Air Temperature',
  'anemometer1': 'Anemometer',
  'anemometer2': 'Anemometer',
  'wpm1': 'WPM'
};

function isInArray(value, array) {
  return array.indexOf(value) > -1;
};

var stationMarker
var map = L.map('map', {minZoom: 1}).setView([
  19.228825, 72.854110
], 1.5);

var OSMLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 10
});

map.addLayer(OSMLayer);

map.on('popupclose', function(e) {
  // console.log('popup closed');
  gaugeTarget.html('');
});

function getObservationURL(id, property) {
  // console.log(property)
  var temp = 'https://sdf.ndbc.noaa.gov/sos/server.php?request=GetObservation&service=SOS&version=1.0.0&offering=urn:ioos:station:wmo:' + id + '&observedproperty=' + property;
  return temp.toString();
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

function getProperties(observedProps) {
  var props = [];
  for (var i = 0; i < observedProps.length; i++) {
    propName = observedProps[i].outerHTML.split('/').slice(-2, -1)[0].split('"')[0]
    // console.log(propName);
    props.push(propName);
  }
  return props;
}

function describeStation(stationXML, stationID, propList, popup) {
  var popupContent = '<img src=\'./images/ndbc_logo.png\' width=\'40\' height=\'40\' class=\"left-align\"/><h5 style=\"display:inline\" class="left-align">   NDBC Station ' + stationID + '</h5>\n<ul class=\"collapsible\">\n'
  temp = ''
  for (var i = 0; i < propList.length; i++) {
    observationURL = getObservationURL(stationID, propList[i]);
    temp = temp + '<li>\n<div class=\"collapsible-header hoverable\" data-url=\"' + observationURL.toString() + '\"><img src=\'https://github.com/daas-ankur-shukla/SOSClient/blob/master/images/' + propList[i] + '.png?raw=true\' width=\'30\' height=\'30\' align=\'left\'/><span>' + obsPropMap[propList[i]] + '</span></div>\n<div class="collapsible-body"></div></li>\n<li>\n<div>'
  }
  popupContent = popupContent + temp + '</div>';
  popup.setContent(popupContent);
  popup.update();
  $('.collapsible').collapsible({
    accordion: true,
    onOpenStart: function(el) {
      var obsURL = el.children[0].attributes[1].nodeValue + '&responseformat=text/xml;subtype="om/1.0.0"&eventtime=latest'.toString();
      $.get(obsURL).done(function(data) {
        // console.log(data);
        subProps = data.getElementsByTagName('swe:CompositePhenomenon')[0].children;
        subPropVals = data.getElementsByTagName('swe2:DataStream')[0].children[2].innerHTML.split(',');
        // console.log(subProps, subPropVals);
        temp = '';
        var gaugeArray;
        var displaySubProp;
        for (var j = 1; j < subProps.length; j++) {
          subProp = subProps[j].attributes[0].nodeValue.split('/').pop()
          // console.log(subProp, subPropVals[j]);
          if (subPropVals[j] != '')
            temp = temp + '<p>' + obsPropMap[subProp] + ': ' + subPropVals[j] + '</p>';
          if (isInArray(subProp, subPropArray)) {
            gaugeArray = [
              subPropRange[subProp][0],
              parseFloat(subPropVals[j]),
              subPropRange[subProp][1]
            ];
            displaySubProp = obsPropMap[subProp];
          }
        }
        // console.log(gaugeArray);
        // console.log(gaugeArray[1]==0, !isNaN(gaugeArray[1]), gaugeArray[1]!='');
        if (gaugeArray[1] == 0 || (!isNaN(gaugeArray[1]) && gaugeArray[1] != '')) {
          var toastHTML = '<div><p style="color:black;">' + displaySubProp + '</p></div><div><canvas id="gauge"></canvas></div>';
          M.toast({html: toastHTML, classes: 'rounded, white'});
          var targetCanvas = document.getElementById('gauge');
          gaugeOptions.staticLabels.labels = gaugeArray;
          // console.log(gaugeOptions);
          var gauge = new Gauge(targetCanvas).setOptions(gaugeOptions); // create sexy gauge!
          gauge.maxValue = gaugeArray[2]; // set max gauge value
          gauge.setMinValue(gaugeArray[0]); // set min value
          gauge.set(gaugeArray[1]); // set actual value
        }
        $('.collapsible-body').html('<span>' + temp + '</span>');
      });
    },
    onCloseStart: function(el) {
      $('.collapsible-body').html('');
      var toastElement = document.querySelector('.toast');
      if (toastElement != null) {
        var toastInstance = M.Toast.getInstance(toastElement);
        toastInstance.dismiss();
      }
    }
  });
}

function refreshDisplay() {
  for (var i = 0; i < stationCount - 1; i++) {
    if (spatialGroup.hasLayer(stationArray[i].marker) && temporalGroup.hasLayer(stationArray[i].marker) && propGroup.hasLayer(stationArray[i].marker)) {
      if (!stationGroups.hasLayer(stationArray[i].marker)) {
        stationGroups.addLayer(stationArray[i].marker);
      }
    } else {
      if (stationGroups.hasLayer(stationArray[i].marker)) {
        stationGroups.removeLayer(stationArray[i].marker);
      }
    }
  }
  stationGroups.refreshClusters();

  //console.log("Station Group", stationGroups)
  //console.log("Station Array", stationArray)
};


function highlightMarker(elem) {
  var selRowStnId = elem.children[0].innerHTML;
  var zoom = 5;
  for (i = 0; i < stationCount - 1; i++) {
    if (stationArray[i].marker.options.stationID == selRowStnId) {
      var iconLatLng = [stationArray[i].marker.getLatLng()];
      map.flyTo([iconLatLng[0].lat, iconLatLng[0].lng], zoom);
      // stationArray[i].marker.openPopup();
    }
  }
};

function refreshChartTable() {
  var stnReading = [];
  var sensorId = []
  var stnId = []
  var traces = [];
  var analytics_url = 'https://sdf.ndbc.noaa.gov/sos/server.php?request=GetObservation&service=SOS&version=1.0.0'
  var selectedVal = $('#propSelect').val();
  if (selectedVal == 'RESET') {
    selectedVal = 'sea_floor_depth_below_sea_surface'
  }
  //boundedStations: Array to store the current number of stations visible on the map

  bounds = map.getBounds();
  stationGroups.eachLayer(function(layer) {
    if (bounds.contains(layer.getLatLng())) {
      //console.log(layer.options.stationID)
      boundedStations.addLayer(layer);
    } else {
      boundedStations.removeLayer(layer);
    }
  });

  boundedStations.eachLayer(function(layer) {
    obs_url = analytics_url + '&offering=urn:ioos:station:wmo:' + layer.options.stationID + '&observedproperty=' + selectedVal + '&responseformat=text/xml;subtype=%22om/1.0.0%22&eventtime=latest'
    $('#table_data').html("");
    $.ajax({
      url: obs_url,
      datatype: 'text',
      beforeSend: function() {
        $('#propSelect').css('background', 'url(https://digitalsynopsis.com/wp-content/uploads/2016/06/loading-animations-preloader-gifs-ui-ux-effects-28.gif) no-repeat center');
        $(".node_data_table").addClass('load');
      },
      success: function(result) {
        temporalXML = StringToXMLDom(result);
        var observationTag = result.getElementsByTagName('swe2:values')

        if (typeof(observationTag[0]) != 'undefined') {
          var currStnId = (observationTag[0].innerHTML.split(',')[0]).split('::')[0].split(':').pop();
          var currSensorId = (observationTag[0].innerHTML.split(',')[0]).split('::')[1];
          var sensorValues = observationTag[0].innerHTML.split(',')[1];
          stnReading.push(sensorValues)

          stnId.push(currStnId)
          sensorId.push(currSensorId)
          $('#table_data').append('<tr id=\'' + currStnId + '\' onclick=highlightMarker(this)><td>' + currStnId + '</td><td>' + sensorTypeMap[currSensorId] + '</td><td>' + sensorValues + '</td></tr>');

        }
      }
    });
  });

  var data = [({x: stnId, y: stnReading, type: 'points'})];

  var layout = {
    title: 'Variation of ' + obsPropMap[selectedVal] + ' With Time',
    autoSize: 'False',
    xaxis: {
      title: 'Timestamp',
      titlefont: {
        family: 'Courier New, monospace',
        size: 8,
        color: '#000000'
      }
    },
    yaxis: {
      title: obsPropMap[selectedVal],
      titlefont: {
        family: 'Courier New, monospace',
        size: 8,
        color: '#000000'
      }
    }
  };

  Plotly.newPlot('chart', data, layout);
  Plotly.relayout('chart', {
            'xaxis.autorange': true,
            'yaxis.autorange': true
        });
  // console.log("Chart Displayed")
};



$('#propSelect').on('change', function() {
  refreshChartTable()
});


// function resetMarkers() {
//   for (i = 0; i < stationCount - 1; i++) {
//     stationArray[i].marker.options.enabled = true;
//     if (!stationGroups.hasLayer(stationArray[i].marker)) {
//       stationGroups.addLayer(stationArray[i].marker);
//     }
//   }
//   stationGroups.refreshClusters();
// }

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
    bb = layer.getLatLngs();
    var currBb = document.getElementById("bb");
    for (var i = 0; i < stationCount - 1; i++) {
      latlong = [stationArray[i].marker.getLatLng()];
      if (!(latlong[0].lat < bb[0][1].lat && latlong[0].lng > bb[0][1].lng && latlong[0].lat > bb[0][3].lat && latlong[0].lng < bb[0][3].lng)) {
        spatialGroup.removeLayer(stationArray[i].marker);
      } else {
        spatialGroup.addLayer(stationArray[i].marker);
      }
    }
    refreshDisplay();
    refreshChartTable();
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
      for (var i = 0; i < stationCount - 1; i++) {
        if (!spatialGroup.hasLayer(stationArray[i].marker)) {
          spatialGroup.addLayer(stationArray[i].marker);
        }
      }
      refreshDisplay();
      refreshChartTable();
    });
    var controlUI = L.DomUtil.create('a', 'leaflet-draw-edit-remove', controlDiv);
    controlUI.title = 'Remove All Polygons';
    controlUI.href = '#';
    return controlDiv;
  }
});
var removeAllControl = new L.Control.RemoveAll();
map.addControl(removeAllControl);

L.Control.TemporalControl = L.Control.extend({
  options: {
    position: 'topright',
    minDate: "",
    maxDate: "",
    layer: null,
    range: false,
    min: 0,
    max: -1
  },
  initialize: function(options) {
    L.Util.setOptions(this, options);
  },

  setPosition: function(position) {
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
    for (var i = 0; i < stationCount - 1; i++) {
      if (!temporalGroup.hasLayer(stationArray[i].marker)) {
        temporalGroup.addLayer(stationArray[i].marker);
      }
    }
    refreshDisplay();
    refreshChartTable();
    $('#leaflet-slider').remove();
  },

  startSlider: function() {
    // console.log('startslider')
    _options = this.options;
    $("#leaflet-slider").slider({
      range: _options.range,
      values: [
        0,
        _options.maxDate.diff(_options.minDate, 'days')
      ],
      min: _options.min,
      max: _options.max,
      step: 1,
      slide: function(e, ui) {
        var low = ui.values[0];
        var high = ui.values[1];
        var dateValMin = moment(_options.minDate);
        var dateValMax = moment(_options.maxDate);
        var tempMin;
        var tempMax;
        if (ui.handleIndex) {
          // console.log('2nd moving')
          tempMin = moment(dateValMin);
          tempMax = moment(dateValMax.subtract(_options.max - high, 'days'));
        } else if ((!ui.handleIndex)) {
          tempMin = moment(dateValMin.add(low, 'days'));
          tempMax = moment(dateValMax);
        }
        $('#slider-timestamp').html('<blockquote>From ' + tempMin.format('LLLL') + ' To ' + tempMax.format('LLLL') + '</blockquote>');
      },
      stop: function(e, ui) {
        var map = _options.map;
        var low = ui.values[0];
        var high = ui.values[1];
        if (low == _options.min && high == _options.max) {
          for (var i = 0; i < stationCount - 1; i++) {
            if (!temporalGroup.hasLayer(stationArray[i].marker)) {
              temporalGroup.addLayer(stationArray[i].marker);
            }
          }
          refreshDisplay();
          refreshChartTable();
        } else {
          var dateValMin = moment(_options.minDate);
          var dateValMax = moment(_options.maxDate);
          var tempMin;
          var tempMax;
          if (low == _options.min) {
            tempMin = moment(dateValMin);
            tempMax = moment(dateValMax.subtract(_options.max - high, 'days'));
          } else if (high == _options.max) {
            tempMin = moment(dateValMin.add(low, 'days'));
            tempMax = moment(dateValMax);
          }
          for (i = 0; i < stationCount - 1; i++) {
            if (!(stationArray[i].marker.options.beginTime > tempMin && stationArray[i].marker.options.endTime < tempMax)) {
              // stationArray[i].marker.options.enabled = false;
              temporalGroup.removeLayer(stationArray[i].marker);
            } else {
              temporalGroup.addLayer(stationArray[i].marker);
            }
          }
          refreshDisplay();
          refreshChartTable();
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
        propGroup.removeLayer(stationArray[i].marker);
      } else {
        propGroup.addLayer(stationArray[i].marker);
      }
    }
  } else {
    for (i = 0; i < stationCount - 1; i++) {
      if (!propGroup.hasLayer(stationArray[i].marker))
        propGroup.addLayer(stationArray[i].marker);
      }
    }
  refreshDisplay();
  refreshChartTable();
};

var propSelectorControl = L.control({position: 'bottomleft'});
propSelectorControl.onAdd = function(map) {
  var div = L.DomUtil.create('div', 'info legend');
  div.innerHTML = '<div id="selector"><select id="propSelect"><option value="RESET" class="waves-effect waves-light" selected>All Properties</option><option value="sea_floor_depth_below_sea_surface" class="waves-effect waves-light">Sea Floor Depth Below Sea Surface</option><option value="air_pressure_at_sea_level" class="waves-effect waves-light">Air Pressure At Sea Level</option><option value="sea_water_temperature" class="waves-effect waves-light">Sea Water Temperature</option><option value="sea_water_salinity" class="waves-effect waves-light">Sea Water Salinity</option><option value="air_temperature" class="waves-effect waves-light">Air Temperature</option><option value="currents">Currents</option><option value="waves">Waves</option><option value="winds">Winds</option></select></div>';
  div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
  return div;
};
propSelectorControl.addTo(map);
var gaugeTarget = $('#gauge'); // your canvas element

$('select').formSelect();
$('#propSelect').on('change', function() {
  // console.log($('#propSelect').val());
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
      const popupHeading = '<p>Please wait, I am looking for my SensorML</p><div class="progress"><div class="indeterminate"></div></div>'
      stationMarker.bindPopup(popupHeading);
      stationMarker.on('click', function(e) {
        // console.log(e.target.options.beginTime, e.target.options.endTime);
        var id = this.options.stationID;
        var observedProps = this.options.observedProps
        var popup = e.target.getPopup();
        var stationData;
        setTimeout(function() {
          // console.log(e.target, e.target.options.stationID)
          $.get(describeStationURL + id).done(function(data) {
            // console.log(data)
            describeStation(data, id, observedProps, popup);
            // popup.setContent(stationData);
            // popup.update();
          });
        }, 150);
      })
      stationArray.push({marker: stationMarker});
      spatialGroup.addLayer(stationMarker);
      temporalGroup.addLayer(stationMarker);
      propGroup.addLayer(stationMarker);
      // stationGroups.addLayer(stationMarker);
    }
    maxDate = moment();
    // console.log(maxDate);
    // console.log(maxDate);
    // console.log(minDate.format('LLLL'), maxDate.format('LLLL'))
    map.addLayer(stationGroups);

    L.control.temporalController = function(id, options) {
      return new L.Control.TemporalControl(id, options);
    }
    // console.log(maxDate.diff(minDate, 'days'), minDate.add(maxDate.diff(minDate, 'days'), 'days').format('LLLL'), maxDate.subtract(maxDate.diff(minDate, 'days'), 'days').format('LLLL'));
    var sliderControl = L.control.temporalController({
      position: 'topright',
      minDate: moment(minDate),
      maxDate: moment(maxDate),
      layer: OSMLayer,
      range: true,
      min: 0,
      max: maxDate.diff(minDate, 'days')
    });
    map.addControl(sliderControl);

    sliderControl.startSlider();
    refreshDisplay();
    refreshChartTable();
    map.on("moveend zoomend", refreshChartTable);
  },
  error: function(xhr, staus, error) {
    console.log('error in ajax', status, error);
  }
});
