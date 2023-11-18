const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const shortid = require("shortid");
const app = express();
var validUrl = require("valid-url");

dotenv.config();
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public", express.static(`${process.cwd()}/public`));

const urlSchema = new mongoose.Schema({
  original_url: { type: String, index: true },
  short_url: { type: String, index: true },
});

const Urls = mongoose.model("urls", urlSchema);

async function connectDB() {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "urls",
    });
    console.log("Connected to Database");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

function isValidUrl(userUrl) {
  if (validUrl.isUri(userUrl)) {
    return true;
  } else {
    return true;
  }
}

async function checkUrl(givenUrl) {
  const result = await Urls.findOne({
    $or: [{ short_url: givenUrl }, { original_url: givenUrl }],
  });
  console.log(result);
  if (result) {
    return result;
  }
  return {};
}
function generateShortString() {
  const randomString = shortid.generate();
  return randomString;
}
function addUrlObject(key) {
  const newUrl = new Urls(key);
  newUrl.save().then(console.log("Url saved"));
}
app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", async (req, res) => {
  var url = req.body.url;
  connectDB().then(() => {
    if (isValidUrl(url)) {
      checkUrl(url).then((chk) => {
        if (JSON.stringify(chk) === "{}") {
          var key = {};
          var shortString = generateShortString();
          var used = checkUrl(shortString);
          if (JSON.stringify(used) === "{}") {
            key = { original_url: url, short_url: shortString };
            addUrlObject(key);
          }
          res.json(key);
        } else {
          res.json({
            original_url: chk.original_url,
            short_url: chk.short_url,
          });
        }
      });
    } else {
      res.json({ error: "invalid url" });
    }
  });
});
app.get("/api/shorturl/:url", async (req, res) => {
  connectDB().then(() => {
    const givenUrl = req.params.url;
    checkUrl(givenUrl).then((chk) => {
      console.log(chk);
      if (JSON.stringify(chk) === "{}") {
        res.json({ error: "No short URL found for the given input" });
      } else {
        res.redirect(chk.original_url);
      }
    });
  });
});
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
