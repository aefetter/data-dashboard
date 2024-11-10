// Initialize the map
var map = L.map('map').setView([35.9132, -79.0558], 13);

// Add a tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Create a marker cluster group
var markers = L.markerClusterGroup();

// Load the noise complaints data
d3.json("data/loud-noise-chapel-hill.json").then(function(data) {
    console.log("Data loaded:", data); // Log data to verify it's loaded correctly

    data.forEach(function(d) {
        if (d.Latitude && d.Longitude) {
            var marker = L.marker([d.Latitude, d.Longitude])
                .bindPopup(`Date: ${d.Date_of_Occurrence}<br>Location: ${d.Street}<br>Description: ${d.Offense}`);
            markers.addLayer(marker);
        } else {
            console.warn("Missing coordinates for data point:", d);
        }
    });

    // Add the marker cluster group to the map
    map.addLayer(markers);
}).catch(function(error) {
    console.error('Error loading or processing data:', error);
});

// Handle scroll event to toggle header styles
window.addEventListener('scroll', function() {
    var header = document.getElementById('main-header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});