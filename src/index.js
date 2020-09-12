/*
This program collects player steam ids from ballchasing.com
together with their rank and then makes an api call to the steam web api and collects their playtime for the final statistic

Author: Sven Peschau
Finished on: 08.09.2020
*/

const fetch = require("node-fetch");
const fs = require("fs");
var _ = require("lodash");
let steam_calls = 0;
var player_map = {};
var data_map = {};
var logs_enabled = true;

//Load existing data
if (fs.existsSync("./data/player_map.json")) {
  let content = fs.readFileSync("./data/player_map.json", "utf-8");
  player_map = JSON.parse(content);
}

if (fs.existsSync("./data/data.json")) {
  let content = fs.readFileSync("./data/data.json", "utf-8");
  data_map = JSON.parse(content);
}



const STEAM_KEY = require("../token.json").steam_key;
const BC_KEY = require("../token.json").ballchasing_key;
const APPID = "[252950]"; // Rocket League ID
const STEAM = "steam";
const RANKS = [
  "unranked",
  "bronze-1",
  "bronze-2",
  "bronze-3",
  "silver-1",
  "silver-2",
  "silver-3",
  "gold-1",
  "gold-2",
  "gold-3",
  "platinum-1",
  "platinum-2",
  "platinum-3",
  "diamond-1",
  "diamond-2",
  "diamond-3",
  "champion-1",
  "champion-2",
  "champion-3",
  "grand-champion",
];



async function getPlaytime(_id) {
  if (player_map[_id] != undefined) {
    if (logs_enabled) {
      console.log(
        "Player is already mapped and has an entry."
      );
    }
    return undefined;
  }

  steam_calls++;

  return fetch(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&input_json={"appids_filter":${APPID}, "steamid":${_id}, "include_appinfo":1}`
  )
    .then((data) => {
      return data.json();
    })
    .then((json) => {

      if (!json.response.games) {
        if (logs_enabled) {
          console.log(
            "Rocket League does not exist in this user profile."
          );
        }
        return undefined;
      }

      if (_.isEmpty(json.response)) {
        if (logs_enabled) {
          console.log(
            "Steam answered with an empty object. Either the rate limit is reached or the profile is set to private."
          );
        }
        return undefined;
      }

      if (json.response.games[0].playtime_forever < 60) {
        if (logs_enabled) {
          console.log(
            "Playtime is less than the treshhold."
          );
        }
        return undefined;
      }

      let playtime = json.response.games[0].playtime_forever / 60;

      console.log(Math.round(playtime) + " hours on record");
      player_map[_id] = _id;
      return playtime;
    })
    .catch((e) => {
      if (logs_enabled) {
        console.error(e);
      }
    });
}

async function setDataByRank(_rank) {
  return new Promise(async function (resolve) {
    let data = await fetch(
      `https://ballchasing.com/api/replays?playlist=ranked-doubles&min-rank=${_rank}&max-rank=${_rank}&count=200`,
      {
        headers: { Authorization: BC_KEY },
      }
    );
    let json = await data.json();
    let games = json.list;
    let promises = games.map(async (game) => {
      let players = [...game.blue.players, ...game.orange.players];

      for (player of players) {
        try {
          if (player.id.platform === STEAM) {
            let playtime = await getPlaytime(player.id.id);
            if (!data_map[_rank]) data_map[_rank] = [];
            if (playtime) data_map[_rank].push(playtime);
          } else {
            if (logs_enabled) console.log("Player not on Steam.");
          }
        } catch (e) {
          if (logs_enabled) {
            console.error(e);
          }
        }
      }
    });
    Promise.all(promises).then(() => {
      resolve("Resolved");
    });
  });
}

async function main() {
  for (rank of RANKS) {
    console.log(rank);
    try {
      await setDataByRank(rank);
    } catch (e) {
      console.error(e);
    }
  }
}

main().then(() => {
  if (logs_enabled) console.log(steam_calls);
  fs.writeFileSync("./data/data.json", JSON.stringify(data_map));
  fs.writeFileSync("./data/player_map.json", JSON.stringify(player_map));
  console.log("FINISHED");
});
