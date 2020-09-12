const fs = require("fs");
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

let keys = Object.keys(data_map);
keys.forEach(key => {
    console.log(key)
    let heighest = data_map[key][0];
    data_map[key].forEach(hours => { hours > heighest ? heighest = hours : null })
    console.log(heighest);
})
