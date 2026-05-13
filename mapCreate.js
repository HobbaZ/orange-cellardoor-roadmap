import { wineries } from "./wineries.js";

function toGeoJSON(data) {
  return {
    type: "FeatureCollection",
    features: data.map((w) => ({
      type: "Feature",
      properties: {
        id: w.id,
        name: w.name,
        address: w.address,
        phone: w.phone,
        website: w.website,
        image: w.image,
        tags: JSON.stringify(w.tags),
      },
      geometry: {
        type: "Point",
        coordinates: [w.coords[1], w.coords[0]],
      },
    })),
  };
}

function renderSidebar(data, map) {
  const list = document.getElementById("winery-list");

  list.innerHTML = "";

  data.forEach((winery) => {
    const card = document.createElement("div");
    const lat = winery.coords[0];
    const lng = winery.coords[1];

    card.className = "winery-card";
    card.dataset.id = winery.id;

    card.innerHTML = `
      <img src="${winery.image}" alt="${winery.name}" />

      <div class="winery-card-content">
        <h4>${winery.name}</h4>

        <p>${winery.address}</p>

        <button class="btn btn-sm btn-dark mt-2"><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank">
  Get Directions
</a></button>

        <div class="winery-tags">
          ${winery.tags
            .map((tag) => `<span class="winery-tag">${tag}</span>`)
            .join("")}
        </div>
      </div>
    `;

    // 🎯 Click card → fly to winery
    card.addEventListener("click", () => {
      map.flyTo({
        center: [winery.coords[1], winery.coords[0]],
        zoom: 14,
      });

      new maplibregl.Popup()
        .setLngLat([winery.coords[1], winery.coords[0]])
        .setHTML(
          `
          <strong>${winery.name}</strong>
        `,
        )
        .addTo(map);
    });

    list.appendChild(card);
  });
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

    // Add source
    map.addSource("wineries", {
      type: "geojson",
      data: toGeoJSON(wineries),
    });

    // Add layer (circle markers)
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

    renderSidebar(wineries, map);

    // 🪄 Popup on click
    map.on("click", "wineries-layer", (e) => {
      const props = e.features[0].properties;

      // remove previous active
      document
        .querySelectorAll(".winery-card")
        .forEach((c) => c.classList.remove("active"));

      // highlight matching card
      const activeCard = document.querySelector(
        `.winery-card[data-id="${props.id}"]`,
      );

      if (activeCard) {
        activeCard.classList.add("active");

        activeCard.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(
          `
      <div class="wine-popup">
        <strong>${props.name}</strong>
      </div>
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

    // filter system
    document.getElementById("filter").addEventListener("change", (e) => {
      const filter = e.target.value;

      const filtered =
        filter === "All"
          ? wineries
          : wineries.filter((w) => w.tags.includes(filter));

      // update map
      map.getSource("wineries").setData(toGeoJSON(filtered));

      // update sidebar
      renderSidebar(filtered, map);
    });
  });
}

mapCreate();
