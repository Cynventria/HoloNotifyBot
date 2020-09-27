////////////////////////////////////////////////////////////////////////////////
///////////////////////FILL IN YOUR KEYS BEFORE STARTING////////////////////////

var bot_token = ''; //your bot token
var googleAPI_Key = ''; //your google API key
var refreshRate = 60000; //refresh rate in ms>
var beforeStart = 300000; //when to post notification before the streaming start in ms


////////////////////////////////////////////////////////////////////////////////



const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

//INITIAL PROGRAM


var scheduledID = [];
var scheduledObj = [];
var channelList = [];


if (fs.existsSync('scheduledObj.json')) { //load saved video data
	scheduledObj = JSON.parse(fs.readFileSync('scheduledObj.json'));
	console.log(scheduledObj);
}



//BOT SETTINGS

client.on('ready', () => {
  console.log('Logged in as '+client.user.tag);
});


client.on('message', msg => { //get message from discord
  //console.log('['+msg.channel.guild.name+']['+msg.channel.name+']'+msg.author.username+':'+msg.content);
  if (msg.content === 'ping') { //ping
    msg.reply('pong');
  }
  else if (msg.content === '!startNotify') {
	console.log('['+msg.channel.guild.name+']['+msg.channel.name+']'+msg.author.username+':'+msg.content);
	msg.reply('START sending hololive streaming notification to channel ' + msg.channel.name + ' in ' + msg.channel.guild.name);
	channelList.push(msg.channel);
	
	notify();
  }
  else if(msg.content === '!stopNotify'){
	console.log('['+msg.channel.guild.name+']['+msg.channel.name+']'+msg.author.username+':'+msg.content);
	msg.reply('STOP sending hololive streaming notification to channel ' + msg.channel.name + ' in ' + msg.channel.guild.name);
	channelList.splice(channelList.indexOf(msg.channel), 1);
  }
});

client.login(bot_token);

//DATA SCAN



scanScheduled();
var intervalID = setInterval(scanScheduled, refreshRate); 



//FUNCTIONS


function scanScheduled(){
	console.log(Date(), 'Scaning Schedule...');
	var xhr_site = new XMLHttpRequest();
	
	
	xhr_site.open("get", "https://schedule.hololive.tv");
	xhr_site.send();
	
	xhr_site.onreadystatechange = function(){
		
		
		if(this.readyState == 4 && this.status == 200){
		
			scheduledID.length = 0;
			var splitted = this.responseText.split("https://www.youtube.com/watch?v=");
			
			for(var i = 0; i < splitted.length; i+=2){
				
				scheduledID.length++;
				scheduledID[i/2] = splitted[i].substring(0,11);			
			}
			scheduledID.shift();
			//console.log(scheduledID);
			
			
			
			var tempSedObj = scheduledObj.slice();
			//console.log(scheduledObj);
			
			scheduledObj.length = 0;
			
			for(var i = 0; i < scheduledID.length; i++){
				scheduledObj.length++;
				
				for(var j = 0; j < tempSedObj.length; j++){
					

					
					
					if(scheduledID[i] == tempSedObj[j].vid){
						
						scheduledObj[i] = tempSedObj[j];
						//console.log('schedule obj passed', i, j);
					}
				}
				if(scheduledObj[i] === undefined){
					
					scanByVid(i);
					console.log('new vid found, request '+scheduledID[i]+' to youtube api')
					
				}
			}
	
			//console.log(scheduledObj);
		}
		
	}
	
	var timeout = setTimeout(DataComplete, 5000);
}

function scanByVid(/*vid, */index){
		
	vid = scheduledID[index];
	key = googleAPI_Key;
	var xhr_vid = new XMLHttpRequest();
	xhr_vid.open("get", "https://www.googleapis.com/youtube/v3/videos?part=snippet%2C%20liveStreamingDetails&id=" + vid + "&key=" + key);
	xhr_vid.send();
	
	xhr_vid.onreadystatechange = function(){
		if(this.readyState == 4 && this.status == 200){
			
			console.log(vid + ' query returned');
			
			returnedJSON = JSON.parse(this.responseText);
			console.log(returnedJSON);
			
			var liveObj = {};
			
			
			
			if(returnedJSON.items[0].snippet != undefined){
				liveObj.title = returnedJSON.items[0].snippet.title;
				liveObj.channelTitle = returnedJSON.items[0].snippet.channelTitle;
				liveObj.vid = returnedJSON.items[0].id;
				if(returnedJSON.items[0].liveStreamingDetails != undefined){
					liveObj.startTime = returnedJSON.items[0].liveStreamingDetails.scheduledStartTime;
					liveObj.thumbnails = "https://i.ytimg.com/vi/" + liveObj.vid + "/maxresdefault_live.jpg";
				}
				else{
					liveObj.startTime = returnedJSON.items[0].snippet.publishedAt;
					liveObj.thumbnails = "https://i.ytimg.com/vi/" + liveObj.vid + "/maxresdefault.jpg";
				}
				liveObj.link = "https://www.youtube.com/watch?v=" + liveObj.vid;
				liveObj.isNew = true;  //prevent re-posting scheduled stream
				liveObj.notified = false;  //prevent re-posting stream notify
			}
			
			//ignore old video appear in schedule website
			var DateObj = new Date();
			if(Date.parse(liveObj.startTime) < DateObj){
				liveObj.isNew = false;
				liveObj.notified = true;
			}
				
			scheduledObj[index] = liveObj;
	
		}
	}
}

function DataComplete(){
	
	notify();
		
	var OBJcontent = JSON.stringify(scheduledObj);
	fs.writeFile("scheduledObj.json", OBJcontent, 'utf8', function (err) {
		if (err) {
			console.log("An error occured while writing JSON Object to File.");
			return console.log(err);
		}
	});
	
}

function notify(){
	console.log(Date(), 'start notifying');
	
	for(var i = 0; i < scheduledObj.length; i++){
		
		if(scheduledObj[i].isNew){
			var embedMsg = new Discord.MessageEmbed()
				.setColor()
				.setTitle(scheduledObj[i].title)
				.setURL(scheduledObj[i].link)
				.setDescription(scheduledObj[i].channelTitle)
				.setThumbnail(scheduledObj[i].thumbnails)
				.addFields(
					{ name: '預計開始時間', value: toLocalTime(scheduledObj[i].startTime) }
				)
			
			for(var j = 0; j < channelList.length; j++){				
				channelList[j].send(embedMsg);
				scheduledObj[i].isNew = false;
			}
		}
		
		if(scheduledObj[i].notified == false){
			var DateObj = new Date();
			var remain = Date.parse(scheduledObj[i].startTime)-DateObj;
			if(remain >= 0 && remain <= beforeStart){
				var embedMsg = new Discord.MessageEmbed()
					.setColor('#ff0000')
					.setTitle(scheduledObj[i].title)
					.setURL(scheduledObj[i].link)
					.setDescription(scheduledObj[i].channelTitle)
					.setImage(scheduledObj[i].thumbnails)
					//.setThumbnail(scheduledObj[i].thumbnails)
					.addFields(
						{ name: '即將開台', value:'\u200B'},
						{ name: '預計開始時間', value:  toLocalTime(scheduledObj[i].startTime) }
					)
				for(var j = 0; j < channelList.length; j++){				
					channelList[j].send(embedMsg);
					scheduledObj[i].notified = true;
				}
			}
				
		}
	}
}
	

function toLocalTime(dateStr){
	var DateO = new Date(dateStr);	
	return DateO.toLocaleString();
}