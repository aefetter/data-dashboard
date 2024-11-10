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
    console.log("Total complaints loaded:", data.length);
    console.log("Date range:", d3.extent(data, d => new Date(d.Date_of_Occurrence)));
    
    // Map markers (existing code)
    data.forEach(function(d) {
        if (d.Latitude && d.Longitude) {
            var marker = L.marker([d.Latitude, d.Longitude])
                .bindPopup(`Date: ${d.Date_of_Occurrence}<br>Location: ${d.Street}`);
            markers.addLayer(marker);
        }
    });
    map.addLayer(markers);

    // Initialize heatmap
    initializeHeatmap(data);

    // Create the radial chart
    createRadialChart(data);
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