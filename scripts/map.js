var map = L.map('map').setView([19.228825, 72.854110], 1.5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 10,
}).addTo(map);

// var marker = L.marker([co[0], co[1]]).addTo(map);
