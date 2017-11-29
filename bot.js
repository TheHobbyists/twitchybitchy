//Constants
let tmi = require("tmi.js");
let colors = require("colors");
let channelId = 150258295;
let s = require("string");
let r = require("request");
let mysql = require('mysql');
let hue = require("node-hue-api")
let HueApi = require("node-hue-api").HueApi;

//Variables
var prefix = "!";
var followArray = ["leedletron"];
var lightState = hue.lightState;

//Hue
var host = "192.168.0.2",
    username = "KwpeHK7Uu9RdGZW5thZ5QEwANJ9vTjbma5WKo9cU",
    api;
api = new HueApi(host, username);
off = lightState.create().off();
on = lightState.create().on();
white = lightState.create().bri(255).hue(0).sat(0);
blue = lightState.create().bri(255).xy(0.21,0.2);
red = lightState.create().bri(255).xy(0.69,0.26);
purple = lightState.create().bri(255).xy(0.3,0.07);
yellow = lightState.create().bri(255).xy(0.45,0.5);
// --------------------------
// Using a promise
api.setLightState(3, on).done();
api.setLightState(3, white).done();
api.setLightState(5, on).done();
api.setLightState(5, white).done();

//MySQL Setup
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: 'twitch'
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

//TMI Setup
var options = {
    options: {
        debug: true
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: "thehobbyists",
        password: "oauth:z69uqvhdk6yl6kgtrf62idy0m70ujt"
    },
    channels: ["#thehobbyists"]
};

var client = new tmi.client(options);

// Connect the client to the server..
client.connect();

//Info Retrievement
/*
client.api({
    url: "https://api.twitch.tv/kraken/user",
    method: "GET",
    headers: {
        "Accept": "application/vnd.twitchtv.v3+json",
        "Authorization": "OAuth hghgi9vofufwo2nzc6kk8nkllifiyu",
        "Client-ID": "ewtcm7jxa1pv80uac56ou3emr3nix1"
    }
}, function(err, res, body) {
    console.log(body);
});
*/

//MySQL sub and add functions
function sub(name, x){
  con.query("UPDATE twitch SET points = points - "+x+" WHERE name = '" + name + "'");
}
function add(name, x){
  con.query("UPDATE twitch SET points = points + "+x+" WHERE name = '" + name + "'");
}

//Follower Handler
setInterval(() => {
  client.api({
      url: "https://api.twitch.tv/kraken/channels/thehobbyists/follows?limit=1&offset=0",
      headers: {
        "Client-ID": "ewtcm7jxa1pv80uac56ou3emr3nix1"
      }
  }, function(err, res, body) {
      followArray = [];
      res.body.follows.forEach(user => followArray.unshift(user.user.name));
  });
  let follower = followArray[0];
  //console.log(follower);
  con.query('SELECT followed FROM twitch WHERE name LIKE ?', [follower], function(err, result) {
if (result[0].followed === 0){
api.setLightState(3, blue).done();
  api.setLightState(5, blue).done();
  setTimeout(function(){
  api.setLightState(3, white).done();
  api.setLightState(5, white).done();
  }, 3000);
  client.action("#thehobbyists", "Thank you for the follow "+follower+" !");
};
if (result[0].followed === 1){
};
});
  con.query('SELECT name FROM twitch WHERE name LIKE ?', [follower], function(err, result) {
if (err) throw err;
if (result.length === 0){
};
if (result.length > 0){
con.query("UPDATE twitch set followed = 1 where name='" + follower + "'");
};
});
}, 15000);


//Join Handler
client.on("join", function(channel, username, self) {
    console.log(username + "has joined the channel.".green);
    con.query('SELECT name FROM twitch WHERE name LIKE ?', [username], function(err, result) {
if (err) throw err;
if (result.length === 0){
    con.query("INSERT INTO twitch (name, points, followed, admin) VALUES ('" + username + "', 100, 0, 0); ");
    }
if (result.length > 0){
};

});
});

client.on("subscription", function (channel, username, method, message, userstate) {
    console.log(username + " followed.".green);
});

//Chat Messages Handler
client.on("chat", function(channel, userstate, message, self) {
  // Don't listen to my own messages..
  if (self) return;
  let name = userstate["username"];

  //Immediately sets up SQL profile if the user doesn't have one
  con.query('SELECT name FROM twitch WHERE name LIKE ?', [name], function(err, result) {
    if (err) throw err;
    if (result.length === 0){
  con.query("INSERT INTO twitch (name, points, followed, admin) VALUES ('" + name + "', 100, 0, 0); ");
    }
    if (result.length > 0){
    };
  });

  //Checks if it is a command or a message
  if (message.includes(prefix)){
      command = message.replace(/!/, '');
      if(command.includes("help")){
        client.whisper(name, "!gamble # - gamble a specific amount of you points !help - this screen !points - see how many points you have");
      }
      if (command.includes("points")){
        con.query("SELECT points FROM twitch WHERE name LIKE '" + name + "'", function(err, result) {

        if (result.length > 0){
            console.log(result[0].points);
            currentPoints = result[0].points;
            client.whisper(name, "You have "+currentPoints+" points!");
        }});
      }
    if(command.includes("gamble ")){
      amount = command.replace(/gamble /, '');

      con.query("SELECT points FROM twitch WHERE name LIKE '" + name + "'", function(err, result) {

      if (result.length > 0){
          console.log(result[0].points);
          currentPoints = result[0].points;
          if(currentPoints >= amount){
            client.whisper(name, "You have gambled "+amount+" points!");
            state = Math.floor((Math.random() * 2) + 1);
            ings = Math.floor((Math.random() * amount) + 1);
            if(state == 1){
              client.whisper(name, "You won "+ ings+" additional points!");
              add(name, ings);
            }
            if(state == 2){
              client.whisper(name, "You lost "+ ings+" of your points...");
              sub(name, ings);
            }
          }
          if(currentPoints < amount){
            client.whisper(name, "You only have "+currentPoints+" points!");
          }

      }});

    }
    }
  else{
  }
});
