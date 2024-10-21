const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.post('/', (req, res) => {
    const url = req.body.body;

    if (!url) {
        return res.status(400).send("No URL provided");
    }

    // Execute the Python scraper script with the URL
    exec(`python3 scraper.py "${url}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).send("Error in scraping");
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).send("Error in scraping");
        }

        // Send the scraped reviews as JSON
        res.send(stdout);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
