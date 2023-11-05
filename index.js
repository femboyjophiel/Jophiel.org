const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 0000;

// Use body-parser middleware to parse JSON requests
app.use(bodyParser.json());

// Serve the static files (e.g., HTML, CSS, JS) from the "public" directory
app.use(express.static(path.join(__dirname, "/public/")));


// Define a route to receive data from your Selenium script
app.post('/codecampstats', (req, res) => {
  const data = req.body;

  // Save the data to a JSON file (e.g., stats.json)
  fs.writeFileSync('public/stats.json', JSON.stringify(data, null, 2));

  
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

