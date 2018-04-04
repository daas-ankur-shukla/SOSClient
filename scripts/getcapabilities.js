var getCapURL = 'https://sdf.ndbc.noaa.gov/sos/server.php?request=GetCapabilities&service=SOS'

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
  url: getCapURL,
  dataType: 'text',
  success: function(result) {
    // console.log(result);
    var parse=StringToXMLDom(result);
    // console.log(parse)
    var requestsTag = parse.getElementsByTagName('sos:Capabilities')[0]
    // console.log(requestsTag)
    var caps = requestsTag.children;
    // console.log(caps)
    var services=caps[3].children[0];
    // console.log(services)
    var ob1=services.children[1];
    // console.log(ob1);
    var name=ob1.children[1];
    // console.log(name.innerHTML);
    var bound=ob1.children[3].children[0].children[0];
    // console.log(bound.innerHTML);
    co=bound.innerHTML.split(' ');
    // console.log(co[0], co[1])
    var marker=L.marker([co[0], co[1]]).addTo(map);
    marker.bindPopup(name.innerHTML);

  },
  error: function(xhr, staus, error) {
    console.log('error in ajax', status, error);
  }
});
