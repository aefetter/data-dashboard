// Initialize the map with center, zoom, and maxBounds
var map = L.map('map', {
    center: [35.9132, -79.0558], // Chapel Hill coordinates
    zoom: 13,
    maxBounds: [
        [35.80, -79.20], // Southwest bounds
        [35.95, -78.95]  // Northeast bounds
    ],
    maxBoundsViscosity: 1.0, // Strict bounds enforcement
    scrollWheelZoom: false,  // Optional: disable scroll zoom
    doubleClickZoom: false,  // Optional: disable double-click zoom
    boxZoom: false,          // Optional: disable box zoom
    dragging: true            // Allow dragging within bounds
});

// Add a tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Create a marker cluster group once
var markers = L.markerClusterGroup();

// Load the noise complaints data
d3.json("data/loud-noise-chapel-hill.json").then(function(data) {
    console.log("Date range:", d3.extent(data, d => new Date(d.Date_of_Occurrence)));
    
    // Map markers
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
    //initialize top ten table
    initializeTopTenTable(data);

    // Initialize DataTable
    $('#myTable').DataTable({
        data: data,
        columns: [
            { 
                data: 'Date_of_Occurrence',
                render: function(data) {
                    return new Date(data).toLocaleDateString();
                }
            },
            { 
                data: 'Date_of_Occurrence',
                render: function(data) {
                    return new Date(data).toLocaleTimeString();
                }
            },
            { data: 'Street' },
            { data: 'Offense' },
        ],
        order: [[0, 'desc']], // Sort by date descending
    });
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

// adding the table
let table = new DataTable('#table', {
    // options
});

// adding top 10 table 
function initializeTopTenTable(data) {
    // Aggregate data to count complaints per date
    const dateCounts = d3.rollup(
        data,
        v => v.length,
        d => d.Date_of_Occurrence.split(' ')[0] // Extract date part
    );

    // Convert the map to an array and sort by count descending
    const sortedDateCounts = Array.from(dateCounts, ([date, count]) => ({ date, count }))
        .sort((a, b) => d3.descending(a.count, b.count))
        .slice(0, 10); // Get top 10 dates

    // Initialize DataTable
    $('#topTenTable').DataTable({
        data: sortedDateCounts,
        columns: [
            { data: 'date', title: 'Date' },
            { data: 'count', title: 'Number of Complaints' }
        ],
        order: [[1, 'desc']], // Sort by number of complaints descending
        responsive: true
    });
}

// function to make hamburger menu work
document.querySelector('.header-container nav').addEventListener('click', function(e) {
    if (e.target.tagName === 'NAV' || e.target === this) {
        this.classList.toggle('active');
    }
});