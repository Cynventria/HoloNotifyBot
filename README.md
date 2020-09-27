# HoloNotifyBot
Simple Discord bot to post Hololive streaming notifications

### Require nodeJS and following packages ###

* discord.js
* xmlhttprequest
* fs

run `npm install` to install needed packages

### Before starting ###

Open `HoloNotifyBot.js`, fill in your bot token and Google API key at the top of the file.

`refreshRate` indicates the interval of checking if there's new scheduled streaming on the Hololive Official site(ms). `default = 1min`

`beforeStart` the Bot will send another notification to tell you the streaming is about to start.  Change this var to configure how long before the scheduled time will the notification being sent. `default = 5min`

run `npm start` or `node HoloNotifyBot.js` to start the server 


### Sending Notification ###

Once the bot logged in, type `!startNotify` to start sending notifications to the current channel.

To stop the bot from sending more notifications, type `!stopNotify`.

Type `ping` to check connection.

### Other Cautions ###

You have to resent `!startNotify` after bot restart.  In other words, list of Discord Channels to sent notifications will be clear after start.

Massive messages will be sent to discord after first `!startNotify`, get prepared.

`scheduledObj.json` will be generated after the bot start, in order to save queried datas and reduce API quota usage.  remove it will cause the bot to re-scan and query the Youtube API after next start.
  **Delete this file & restart if the Bot goes wrong.**

I do not take any responsibility of comsuming API quota or being banned, it usually wont take up too much but how do I know.

You may be banned if you set the refresh interval too short. 

This code do nothing with HoloLive Official
