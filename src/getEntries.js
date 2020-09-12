const fs = require("fs");
var _ = require("lodash");

var player_map = {};
var data_map = {};

//Load existing data
if (fs.existsSync("./data/player_map.json")) {
    let content = fs.readFileSync("./data/player_map.json", "utf-8");
    player_map = JSON.parse(content);
}

if (fs.existsSync("./data/data.json")) {
    let content = fs.readFileSync("./data/data.json", "utf-8");
    data_map = JSON.parse(content);
}

console.log(Object.keys(player_map).length);
