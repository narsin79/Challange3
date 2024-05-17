const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.json());

// Mock data for cities
const citiesData = require("./addresses.json");

// Middleware for authentication
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== "bearer dGhlc2VjcmV0dG9rZW4=") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// Haversine formula to calculate distance between two points on Earth
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Endpoint for retrieving cities by tag
app.get("/cities-by-tag", (req, res) => {
  const { tag, isActive } = req.query;
  const filteredCities = citiesData.filter((city) => {
    return city.tags.includes(tag) && (isActive ? city.isActive : true);
  });
  res.json({ cities: filteredCities });
});

// Endpoint for calculating distance between two cities
app.get("/distance", (req, res) => {
  const { from, to } = req.query;
  const cityFrom = citiesData.find((city) => city.guid === from);
  const cityTo = citiesData.find((city) => city.guid === to);

  if (!cityFrom || !cityTo) {
    return res.status(404).json({ error: "City not found" });
  }

  const distance = calculateDistance(
    cityFrom.latitude,
    cityFrom.longitude,
    cityTo.latitude,
    cityTo.longitude
  );
  res.json({
    from: cityFrom,
    to: cityTo,
    unit: "km",
    distance: parseFloat(distance.toFixed(2)),
  });
});

// Endpoint for calculating area
app.get("/area", (req, res) => {
  const { from, distance } = req.query;
  const cityFrom = citiesData.find((city) => city.guid === from);

  if (!cityFrom) {
    return res.status(404).json({ error: "City not found" });
  }

  // Mock the result URL and UUID
  const resultsUrl = `${req.protocol}://${req.get(
    "host"
  )}/area-result/2152f96f-50c7-4d76-9e18-f7033bd14428`;
  res.status(202).json({ resultsUrl });
});

// Endpoint for retrieving area calculation result
app.get("/area-result/:uuid", (req, res) => {
  const { uuid } = req.params;

  // Mock implementation for example
  if (uuid === "2152f96f-50c7-4d76-9e18-f7033bd14428") {
    // Mock cities within 250 km of the first city
    const cityFrom = citiesData.find(
      (city) => city.guid === "ed354fef-31d3-44a9-b92f-4a3bd7eb0408"
    );
    const citiesWithinDistance = citiesData.filter((city) => {
      const distance = calculateDistance(
        cityFrom.latitude,
        cityFrom.longitude,
        city.latitude,
        city.longitude
      );
      return distance <= 250;
    });

    return res.status(200).json({ cities: citiesWithinDistance });
  }

  res.status(404).json({ error: "Result not found" });
});

// Endpoint for retrieving all cities
app.get("/all-cities", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const fileStream = fs.createReadStream(
    path.join(__dirname, "addresses.json")
  );
  fileStream.pipe(res);
});

// Start server
const port = process.env.PORT || 8090;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
