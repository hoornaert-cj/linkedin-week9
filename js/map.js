//Declare global variables for map, GeoJSON layers, and highlight lists
let map;
let geoJsonLayer;
let top5 = [];
let bottom5 = [];

//Function to Assign based on ranking
function getColor(rank) {
    return rank <= 3 ? "#1b4e4f"
    : rank <= 6 ? "#2a6d5e"
    : rank <=9 ? "#3f816b"
    : rank <=12 ? "#5c9a79"
    : rank <=15 ? "#7ab18a"
    : rank<=18 ? "#c1d9c0"
    : "#dddddd"; //default grey for lowest category
}

//Populate the dropdown with local area/neigbhourhood names
function populateDropdown(data) {
    const dropdown = document.getElementById("neighbourhood-dropdown");
    dropdown.innerHTML = ""; //Clear any existing options

    //Sort features alphabetically by NAME
    data.features.sort((a,b) => a.properties.name.localeCompare(b.properties.name));

    //create <option> elements for each local area/neighbourhood
    data.features.forEach(f => {
        const option = document.createElement("option");
        option.value = f.properties.fid;
        option.textContent = f.properties.name;
        dropdown.appendChild(option);
    })

    //add event listener to zoom on selection
    dropdown.addEventListener("change", () => {
        const id = Number(dropdown.value);
        const match = data.features.find(f => f.properties.fid == id);
        if(match) zoomToNeighbourhood(match);
    });
}

//zoom map to selected neighourhood feature
function zoomToNeighbourhood(f) {
    geoJsonLayer.eachLayer(layer => {
        if (layer.feature.properties.fid === f.properties.fid) {
            map.fitBounds(layer.getBounds());
            layer.openPopup();
        }
    });
}

//Highlight the top 5 neighbourhoods
function highlightTop5() {
    geoJsonLayer.eachLayer(layer => {
        if(top5.includes(layer.feature.properties.name)) {
            layer.setStyle({fillColor: "#FFD700", color: "#ffff", weight: 2, fillOpacity: 0.9});
            layer.isTop5 = true
        }
    })
}

//reset top 5
function resetTop5() {
    geoJsonLayer.eachLayer(layer => {
        if(top5.includes(layer.feature.properties.name)) {
            layer.isTop5 = false;
            geoJsonLayer.resetStyle(layer);
        }
    });
}

function highlightBottom5() {
    geoJsonLayer.eachLayer(layer => {
        if(bottom5.includes(layer.feature.properties.name)) {
            layer.setStyle({fillColor: "#8B0000", color: "#ffff", weight: 2, fillOpacity: 0.9});
            layer.isBottom5 = true;
        }
    });
}

//reset bottom 5
function resetBottom5() {
    geoJsonLayer.eachLayer(layer => {
        if (bottom5.includes(layer.feature.properties.name)) {
            layer.isBottom5 = false;
            geoJsonLayer.resetStyle(layer);
        }
    });
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

    populateDropdown(data);

    //determine top 5 and bottom 5 neighbourhoods
    const sorted = data.features.sort((a,b) => a.properties.rank - b.properties.rank);
    top5 = sorted.slice(0,5).map(f => f.properties.name);
    const maxRank = Math.max(...data.features.map(f => f.properties.rank));
    // bottom5 = data.features.filter(f => f.properties.rank >= maxRank - 4).map(f => f.properties.name);
    bottom5 = sorted.slice(-5).map(f => f.properties.name);

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

    //Add reset button to reset zoom
    const resetControl = L.control({ position: "topleft"});
    resetControl.onAdd = () => {
        const div = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-custom");
        div.innerHTML = '🔄';
        Object.assign(div.style, {
            backgroundColor: "white",
            width: "1.875rem",
            height: "1.875rem",
            lineHeight: "1.875rem",
            textAlign: "center",
            cursor: "pointer",
            fontSize: "1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
        });
        div.onclick = () => {
            const bounds = geoJsonLayer.getBounds();
            if(bounds.isValid()) {
                map.fitBounds(bounds, { padding: [20, 20]});
            }
        };
        return div
    };
    resetControl.addTo(map);

    //Add legend to explain color scheme
    const legend = L.control({ position: "bottomleft" });
    legend.onAdd = () => {
        const div = L.DomUtil.create("div", "info legend");
        const grades = [1, 4, 7, 10, 13, 16, 19];
        div.innerHTML = "<h4>Neighbourhood Rank<br><small>(1=best)</small></h4>" + grades.map((from, i) => {
            const to = grades[i+1] - 1;
            return `<i style="background:${getColor(from)}"></i> ${from}${to ? "-" + to : "+"}`;
        }).join("<br>");
        return div
    };
    legend.addTo(map);
})
    .catch(err => console.error("GeoJSON load error: ", err));
});

//event listeners for checkboxes
document.getElementById("top5").addEventListener("change", function() {
    this.checked ? highlightTop5() : resetTop5();
});
document.getElementById("bottom5").addEventListener("change", function() {
    this.checked ? highlightBottom5() : resetBottom5();
});
