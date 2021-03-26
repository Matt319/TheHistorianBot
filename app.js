// app.js
// Written by Matt Asgari 2021

require('dotenv').config();
const gis = require('g-i-s');
const fs = require('fs');
const request = require('request');
const wiki = require('wikijs').default;


var Twit = require('twit');

var twitter = new Twit({
    consumer_key: process.env.API_KEY,
    consumer_secret: process.env.API_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    timeout_ms: 60*1000
});

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

let date = new Date();
let month = monthNames[date.getMonth()];
let day = date.getDate();

let search = month + ' ' + day;
var tweet = ``;

wiki().page(search).then(page => page.content()).then(content => {

    for (var i = 0; i < content.length; i++) {

        let section = content[i];

        if (section['title'] == 'Events') {
            let events = section['content'].split('\n');

            var event = ''
            var eventText = ''

            while (true) {
                event = events[Math.floor(Math.random() * events.length)];

                let index = event.indexOf('–');
                let eventYear = Number(event.slice(0, index));
                let yearsAgo = date.getFullYear() - eventYear;
                eventText = event.slice(index+1).trim();

                tweet = `${yearsAgo} years ago today (${month} ${day}),\n\n${eventText} (${eventYear})`;

                console.log(tweet);

                if (tweet.length < 280) {
                    break
                }
            }

            gis(eventText, logResults);
        }
    }
});

function logResults(error, results) {
    if (error) {
        console.log('Error not including image');
        tweetText({ status: tweet });
    }
    else {
        if (results.length > 0) {
            let imgData = results[1];
            let imgUrl = imgData['url'];

            download(imgUrl, 'img.png', function() {
                console.log('Downloaded image');
                tweetWithImage(tweet, 'img.png');
            });

        } else {
            console.log('Search returned no results');
            tweetText({ status: tweet });
        }
    }
}

function tweetWithImage(text, imgPath) {
    let b64content = fs.readFileSync(imgPath, { encoding: 'base64' });

    twitter.post('media/upload', { media_data: b64content }, function (err, data, response) {
        let mediaIdStr = data.media_id_string;
        let altText = 'Attatched photo';
        let meta_params = { media_id: mediaIdStr, alt_text: { text: altText } };

        twitter.post('media/metadata/create', meta_params, function (err, data, response) {
            if (err) {
                tweetText({ status: tweet });
            } else {
                let params = { status: tweet, media_ids: [mediaIdStr] }

                tweetText(params);
            }
        })
    });
}

var download = function(uri, filename, callback){
    request.head(uri, function(err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
  };

function tweetText(params) {
    twitter.post('statuses/update', params, function(err, data, response) {
        console.log('Twitter status updated');
    });
}
