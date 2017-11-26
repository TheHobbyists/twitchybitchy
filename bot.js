var tmi = require("tmi.js");

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


//Used to see User info/Bot info
/*
client.api({
    url: "https://api.twitch.tv/kraken/user",
    method: "GET",
    headers: {
        "Accept": "application/vnd.twitchtv.v3+json",
        "Authorization": "OAuth z99931k9rxpv5gd1v0a64910wpanqb",
        "Client-ID": "ewtcm7jxa1pv80uac56ou3emr3nix1"
    }
}, function(err, res, body) {
    console.log(body);
});
*/

client.on("join", function(channel, username, self) { client.say(channel, "I have joined the channel."); });
