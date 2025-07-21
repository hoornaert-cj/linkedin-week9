//Declare global variables for map, GeoJSON layers, and highlight lists
let map;
let geoJsonLayer;
let top5 = [];
let bottom5 = [];

//Function to Assign based on ranking
function getColor(rank) {
    return rank <= 3 ? "#1b4e4f"
    : rank <= 6 ? "2a6d5e"
    : rank <=9 ? "#3f816b"
    : rank <=12 ? "#5c9a79"
    : rank <=15 ? "#7ab18a"
    : rank<=18 ? "#c1d9c0"
    : "#dddddd"; //default grey for lowest category
}

//Load GeoJSON and initialize map
document.addEventListener("DOMContentLoaded", function () {
    fetch("data/grocery_local_areas.geojson")
    .then(res => res.json())
    .then(data => {
        if (!data || data.type !== "FeatureCollection") {
            console.error("Invalid GeoJSON");
            return
        }

        //Create Leaflet map
        map = L.map("map").setView([49.254, -123.127], 12);

        //Add tile layer
        L.tileLayer("https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png?api_key=22685591-9232-45c7-a495-cfdf0e81ab86", {
            maxZoom: 18,
            attribution : '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, ' + '&copy; <a href="https://stamen.com/">Stamen Design</a>, ' + '&copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, ' + '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    //Add GeoJSON  to map
    geoJsonLayer = L.geoJSON(data, {
        style: f=> ({
            fillColor: getColor(f.properties.rank),
            color: "white",
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.9,
        }),
        onEachFeature: (feature, layer) => {
            //Tooltip on hover
            layer.bindTooltip(`${feature.properties.name} (Rank ${feature.properties.rank})` , {
                direction: "top",
                className: "neighbourhood-tooltip"
            }) ;
        }
    }).addTo(map);
})
});
