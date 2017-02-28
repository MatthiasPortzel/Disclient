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
var member;

String.prototype.pad = function (length) {
   return (this.toString()+Array(length).join(" ")).slice(0, length);
};

var displayMessage = function (message) {
   if (server && message.guild.id === server.id) {
      var content = message.content;
      content = content.replace(/<@&(\d{18})>/g, (m, id) => ("@" + message.mentions.roles.get(id).name).magenta);
      content = content.replace (/<#(\d{18})>/g, (m, id) => ("#" + message.mentions.channels.get(id).name).cyan);
      content = content.replace(/<@!?(\d{18,17})>/g, (m, id) => ("@" + message.mentions.users.get(id).username).green);
      content = content.replace(/([^\\]|^)\*\*(\S+?)([^\\])\*\*/g, (m, m1, m2, m3) => m1 + (m2 + m3).bold);
      console.log(message.author.username.pad(15).green + (" (# " + message.channel.name.pad(13) + "): ").cyan + content);
      lastChannel = message.channel;
   }
};

var getChannel = function (channelName, perm) {
   if (perm && perm.toLowerCase() === "send")  {
      perm = "SEND_MESSAGES";
   }else {
      perm = "READ_MESSAGES";
   }
   if (!channelName){
      if (lastChannel) {
         return lastChannel;
      }else {
         return server.defaultChannel;
      }
   }
   channelName = channelName.toLowerCase();
   var channels = server.channels.array();
   var matches = [];
   for (var i = 0; i < channels.length; i++) {
      if (channels[i].permissionsFor(member).hasPermission(perm) && channels[i].type !== "voice"
         && channels[i].name.search(new RegExp(channelName)) > -1) {
         matches.push(channels[i]);
      }
   }
   if (matches.length === 0) {
      return null;
   }else if (matches.length === 1) {
      return matches[0];
   }else {
      return matches;
   }
};

var say = function (txt) {
   if (!server)
      return;

   var channel = getChannel();

   var sendMessage = true;

   if (txt.startsWith("/")) {
      if (txt.startsWith("/#")) {
         channelName = txt.replace(/\/#(\S+).*/, "$1");
         txt = txt.replace(/\/#\S+\s(.*)/, "$1");

         channel = getChannel(channelName, "send");
         if (!channel) {
            console.log("Invalid chennel");
            sendMessage = false;
         }else {
            console.log("Sending message in " + ("#" + channelName).cyan);
         }
      }
      if (txt.toLowerCase().startsWith("/leave") || txt.startsWith("/l")) {
         console.log("You've left " + server.name);
         server = null;
         member = null;
         lastChannel = null;
         chooseServer();
         return;
      }
      if (txt.toLowerCase().startsWith("/exit") || txt.startsWith("/e")) {
         console.log("Thanks for using Disclient!");
         rl.close();
         Client.destroy();
         return;
      }
      if (txt.toLowerCase().startsWith("/channels") || txt.startsWith("/c")) {
         var channels = getChannel(".*");

         for (var i = 0; i < channels.length; i++) {
            console.log(("#" + channels[i].name).cyan);
         }
         sendMessage = false;
      }
      ///getMessages <number> [channel]
      if (txt.toLowerCase().startsWith("/getmessages") || txt.startsWith("/gm")) {
         var args = txt.split(" ");
         var num = parseInt(args[1] || " ", 10);
         if (num && num > 0) {
            var chan = getChannel(args[2]);
            if (chan instanceof Discord.Channel) {
               chan.fetchMessages({limit: num}).then(messages => {
                  for (var i = messages.length -1; i >= 0; i--) {
                     displayMessage(messages[i]);
                  }
               });
            }else {
               console.log("Error, not a valid channel name.");
            }
         }else {
            console.log("Invalid number.");
         }
         sendMessage = false;
      }
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
      member = server.members.get(Client.user.id);

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
