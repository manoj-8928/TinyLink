const express = require("express");
const path = require("path");
const methodOverride = require("method-override");

const apiLinks = require("./routes/api/links");
const webRoutes = require("./routes/web");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));

app.use("/api/links", apiLinks);
app.use("/", webRoutes);

app.use((req, res) => res.status(404).send("Not found"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
