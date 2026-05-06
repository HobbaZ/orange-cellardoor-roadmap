import { wineries } from "./wineries.js";

function toGeoJSON(data) {
  return {
    type: "FeatureCollection",
    features: data.map((w) => ({
      type: "Feature",
      properties: {
        name: w.name,
        tags: w.tags,
      },
      geometry: {
        type: "Point",
        coordinates: [w.coords[1], w.coords[0]],
      },
    })),
  };
}

function mapCreate() {
  const map = new maplibregl.Map({
    container: "map",
    style: {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: "osm",
          type: "raster",
          source: "osm",
        },
      ],
    },
    center: [149.101, -33.283],
    zoom: 11,
  });

  map.on("load", () => {
    console.log("map loaded");

    // 🧠 Add source
    map.addSource("wineries", {
      type: "geojson",
      data: toGeoJSON(wineries),
    });

    // 🎯 Add layer (circle markers)
    map.addLayer({
      id: "wineries-layer",
      type: "circle",
      source: "wineries",
      paint: {
        "circle-radius": 7,
        "circle-color": [
          "match",
          ["get", "category"],
          "Restaurant",
          "#e74c3c",
          "Live Music",
          "#9b59b6",
          "Dog Friendly",
          "#2ecc71",
          "#8b0000",
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    // 🪄 Popup on click
    map.on("click", "wineries-layer", (e) => {
      const props = e.features[0].properties;

      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          `
          <strong>${props.name}</strong><br>
          ${JSON.parse(props.tags).join(", ")}
        `,
        )
        .addTo(map);
    });

    // 👆 cursor change
    map.on("mouseenter", "wineries-layer", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "wineries-layer", () => {
      map.getCanvas().style.cursor = "";
    });

    // 🔽 filter system
    document.getElementById("filter").addEventListener("change", (e) => {
      const filter = e.target.value;

      const filtered =
        filter === "All"
          ? wineries
          : wineries.filter((w) => w.tags.includes(filter));

      map.getSource("wineries").setData(toGeoJSON(filtered));
    });
  });
}

mapCreate();
