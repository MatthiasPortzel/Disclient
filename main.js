const readline = require('readline');
const Discord = require('discord.js');
const colors = require('colors');

const Client = new Discord.Client();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var server;
var lastChannel;

String.prototype.pad = function (length) {
   return (this.toString()+Array(length).join(" ")).slice(0, length);
};

var displayMessage = function (message) {
   if (server && message.guild.id === server.id) {
      var displayName = (message.member && message.member.nickname) ? message.member.nickname : message.author.username;
      var content = message.content;
      content = content.replace(/<@&(\d{18})>/g, (m, id) => ("@" + message.mentions.roles.get(id).name).magenta);
      content = content.replace (/<#(\d{18})>/g, (m, id) => ("#" + message.mentions.channels.get(id).name).cyan);
      content = content.replace(/<@!?(\d{18})>/g, (m, id) => ("@" + message.mentions.users.get(id).username).green);
      content = content.replace(/([^\\]|^)\*\*(\S+?)([^\\])\*\*/g, (m, m1, m2, m3) => m1 + (m2 + m3).bold);
      console.log(displayName.pad(15).green + (" (# " + message.channel.name.pad(13) + "): ").cyan + content);
      lastChannel = message.channel;
   }
};

var say = function (txt) {
   if (!server)
      return;

   var channel = lastChannel;

   var sendMessage = true;

   if (txt.startsWith("/")) {
      if (txt.startsWith("/#")) {
         channelName = txt.replace(/\/#(\S+).*/, "$1");
         txt = txt.replace(/\/#\S+\s(.*)/, "$1");
         console.log("Sending message in " + ("#" + channelName).cyan);
         channel = server.channels.find("name", channelName.toLowerCase());
      }
      if (txt.startsWith("/leave")) {
         console.log("You've left " + server.name);
         server = null;
         lastChannel = null;
         chooseServer();
         return;
      }
      if (txt.toLowerCase().startsWith("/exit")) {
         console.log("Thanks for using Disclient!");
         rl.close();
         Client.destroy();
         return;
      }
      if (txt.startsWith("/channels")) {
         var channels = server.channels.array();

         for (var i = 0; i < channels.length; i++) {
            if (channels[i].permissionsFor(server.members.get(Client.user.id)).hasPermission('READ_MESSAGES')) {
               console.log(("#" + channels[i].name).cyan);
            }
         }
         sendMessage = false;
      }
   }
   if (!channel) {
      channel = server.defaultChannel;
   }
   if (sendMessage) {
      channel.sendMessage(txt);
   }

   rl.question('', say);
};

var chooseServer = function () {
   guilds = Client.guilds.array();

   console.log("Please choose a server to join.");
   for (var i = 0; i < guilds.length; i ++) {
      console.log("  " + (i + 1) + ": " + guilds[i].name);
   }

   rl.question('Server Number? ', (answer) => {
      serverNum = parseInt(answer, 10)-1;
      if (Number.isNaN(serverNum) || serverNum < 0 || serverNum > guilds.length) {
        console.log("That's not a valid server number");
        chooseServer();
        return;
      }
      server = guilds[serverNum];

      rl.question('', say);

      console.log("Connected.");
   });
};

var login = function (token) {
   console.log("Logging in...");
   Client.login(token).then(() => {
      chooseServer();

      Client.on("message", displayMessage);
   });
};

try {
   login(require('./token.json'));
}catch(e) {
   console.log(e);

   rl.question("token.js not found or invalid. Discord API Token?\n", login);
}
