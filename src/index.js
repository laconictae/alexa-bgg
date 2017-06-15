'use strict';
var Alexa = require('alexa-sdk');
var request = require('request');
var xml2js = require('xml2js');
var html2plaintext = require('html2plaintext');

var APP_ID = "amzn1.ask.skill.2f2a43bd-cb7a-4c0f-b5ad-2deda80c49d1";

var SKILL_NAME = "Board Game Rankings";
var GET_FACT_MESSAGE = "Here's your game ranking: ";
var HELP_MESSAGE = "You can say tell me a board game ranking, or, you can say exit... What can I help you with?";
var HELP_REPROMPT = "What can I help you with?";
var STOP_MESSAGE = "Goodbye!";

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('GetNewFactIntent');
    },
    'GetGameRankingIntent': function () {
        var alexa = this;
        var game = alexa.event.request.intent.slots.game.value; // 4srs?

        GetGameRanking(game, function (text) {
            alexa.emit(':tellWithCard', text, SKILL_NAME, text);
        });
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = HELP_MESSAGE;
        var reprompt = HELP_REPROMPT;
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    }
};

var GetGameRanking = function (search, callback)
{
    var parser = new xml2js.Parser();
    request.get('http://www.boardgamegeek.com/xmlapi/search?search=' + game.replace(' ', '%20'), function (error, response, body) {
        parser.parseString(body, function (err, result) {
            if (result.boardgames.boardgame.length < 1) {
                callback("I'm sorry, I could not find ranking data for " + game);
            }
            else if (result.boardgames.boardgame.length > 5)
            {
                callback("I found more than five matching games, please use a more specific search term.");
            }
            else if (result.boardgames.boardgame.length > 1 && result.boardgames.boardgame.length < 6)
            {
                var speechResult = "I found multiple games matching the search text " + game + ". Which of these is what you were looking for?";

                for (i = 0; i < result.boardgames.boardgame.length; i++)
                {
                    speechResult += "<break /> " + result.boardgames.boardgame[i].name[0];
                }                

                callback(speechResult);
            }
            else if (result.boardgames.boardgame.length == 1)
            {
                var theGame = result.boardgames.boardgame[0];

                request.get('http://www.boardgamegeek.com/xmlapi/boardgame/' + theGame.$.objectid, function (error2, response2, body2) {
                    parser.parseString(body, function (err2, result2) {
                        theGame = result2.boardgames.boardgame[0];
                        var rankings = [];
                        for (i = 0; i < theGame.statistics.ranks.rank.length; i++)
                        {
                            var thisRank = theGame.statistics.ranks.rank[i];
                            rankings[i] = { rank: thisRank.value, name: thisRank.friendlyname };
                        }

                        callback(game + " is ranked number " + rankings[0].rank + "overall.");
                    });
                });
            }
        });
    });
}