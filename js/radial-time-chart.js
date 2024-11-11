// Constants defined outside function
const PADDING = 40;

function createRadialChart(data) {
    // Get viewport dimensions with padding
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) - PADDING;
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) - PADDING;

    // Set base dimensions
    const size = Math.min(vw, vh); // Use smallest viewport dimension
    const width = size;
    const height = size;
    const margin = size * 0.1; // Reduce margin to 10%
    const innerRadius = size * 0.15;
    const outerRadius = (size / 2) - margin;

    // Clear any existing chart
    d3.select("#radial-chart").selectAll("*").remove();

    // Create responsive SVG container
    const svg = d3.select("#radial-chart")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("width", "100%")
        .style("height", "auto")
        .style("max-width", `${size}px`)
        .style("display", "block")
        .style("margin", "0 auto")
        .append("g")
        .attr("transform", `translate(${width/2},${height/2})`);

    // Create tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "radial-tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("padding", "8px")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("z-index", 1000);

    // Process data using string parsing instead of Date object
    const hourlyData = d3.rollup(
        data,
        v => v.length,
        d => {
            const hour = d.Date_of_Occurrence.split(" ")[1].split(":")[0];
            return parseInt(hour);
        }
    );

    const counts = Array.from({length: 24}, (_, i) => ({
        hour: i,
        count: hourlyData.get(i) || 0
    }));

    // Color scale using Carolina blues
    const color = d3.scaleSequential()
        .domain([0, d3.max(counts, d => d.count)])
        .interpolator(d3.interpolateBlues);

    // Radial scale
    const angle = d3.scaleLinear()
        .domain([0, 24])
        .range([0, 2 * Math.PI]);

    // Arc generator
    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(d => innerRadius + (outerRadius - innerRadius) * (d.count / d3.max(counts, d => d.count)))
        .startAngle(d => angle(d.hour))
        .endAngle(d => angle(d.hour + 1))
        .padAngle(0.01)
        .padRadius(innerRadius);

    // Add bars with click tooltips
    svg.selectAll("path")
        .data(counts)
        .join("path")
        .attr("fill", d => color(d.count))
        .attr("d", arc)
        .on("click", function(event, d) {
            tooltip.style("opacity", 0);
            tooltip
                .style("opacity", 1)
                .html(`Time: ${d.hour}:00 - ${(d.hour + 1) % 24}:00<br>Complaints: ${d.count}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            event.stopPropagation();
        });

    // Click anywhere else to hide tooltip
    d3.select("body").on("click", () => {
        tooltip.style("opacity", 0);
    });

    // Add hour labels
    const hours = svg.selectAll(".hour")
        .data(counts)
        .join("g")
        .attr("class", "hour")
        .attr("transform", d => `
            rotate(${(angle(d.hour) * 180 / Math.PI - 90)})
            translate(${outerRadius + 20},0)
        `);

    hours.append("text")
        .attr("transform", d => (angle(d.hour) >= Math.PI ? "rotate(180)" : ""))
        .attr("text-anchor", d => angle(d.hour) >= Math.PI ? "end" : "start")
        .attr("dominant-baseline", "middle")
        .text(d => `${d.hour}:00`)
        .style("font-size", "12px")
        .style("fill", "#666");
}

// Add resize listener
window.addEventListener('resize', () => {
    // Recalculate dimensions
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    
    const width = Math.min(vw * 0.8, 800);
    const height = width;
    const margin = width * 0.125;
    const innerRadius = width * 0.15;
    const outerRadius = Math.min(width, height) / 2 - margin;
    
    // Update chart (call your chart update function)
    updateRadialChart();
});

// Add to your existing chart code
function updateRadialChart() {
    // Select existing SVG
    const svg = d3.select("#radial-chart svg");
    
    // Update SVG dimensions
    svg.attr("width", width)
       .attr("height", height);
    
    // Update chart elements' positions and sizes
    // ... update your existing chart elements
}

// Add resize handler using constant
window.addEventListener('resize', () => {
    const newVw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) - PADDING;
    const newVh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) - PADDING;
    const newSize = Math.min(newVw, newVh);
    
    d3.select("#radial-chart svg")
        .style("max-width", `${newSize}px`);
});

// Export the function
window.createRadialChart = createRadialChart;