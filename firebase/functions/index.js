
const functions = require('firebase-functions'); // Cloud Functions for Firebase library
const DialogflowApp = require('actions-on-google').DialogflowApp; // Google Assistant helper library
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  if (request.body.result) {
    processV1Request(request, response);
  } else if (request.body.queryResult) {
    processV2Request(request, response);
  } else {
    console.log('Invalid Request');
    return response.status(400).end('Invalid Webhook Request (expecting v1 or v2 webhook request)');
  }
});

/*
* Handle webhook requests from Dialogflow
*/
function processV1Request (request, response) {
  let action = request.body.result.action; // https://dialogflow.com/docs/actions-and-parameters
  let parameters = request.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters
  let inputContexts = request.body.result.contexts; // https://dialogflow.com/docs/contexts
  let requestSource = (request.body.originalRequest) ? request.body.originalRequest.source : undefined;
  const googleAssistantRequest = 'google'; // Constant to identify Google Assistant requests
  const app = new DialogflowApp({request: request, response: response});
  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers = {
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'input.unknown': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        sendGoogleResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
      } else {
        sendResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
      }
    },
    // Begin narration of the game
    'game.narrate': () => {
      // Get game info
      let game_params = inputContexts[0].parameters;
      let game = game_params.game;
      let players = game_params.players;
      let joker = game_params.joker !== '';
      let roles = game_params['avalon-set'];
      let speak = '';
      
      if(game === 'The Resistance: Avalon') {
        
        speak += 'Narrating Avalon';
        
      } else if (game === 'The Resistance') {
        
        speak += 'Narrating The Resistance';
        
      } else if (game === 'Secret Hitler') {
        
        speak += 'Narrating Secret Hitler';
        
      }
      
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        let responseToUser = {
          speech: speak, // spoken response
          text: 'Narrating a game of ' + game // displayed response
        };
        sendGoogleResponse(responseToUser);
      } else {
        let responseToUser = {
          speech: speak, // spoken response
          text: 'Narrating a game of ' + game // displayed response
        };
        sendResponse(responseToUser);
      }
    },
    // Default response
    'default': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        let responseToUser = {
          speech: 'This is the default Google response', // spoken response
          text: 'This is the default Google response' // displayed response
        };
        sendGoogleResponse(responseToUser);
      } else {
        let responseToUser = {
          speech: 'This is the default response', // spoken response
          text: 'This is the default response' // displayed response
        };
        sendResponse(responseToUser);
      }
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
    // Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
  function sendGoogleResponse (responseToUser) {
    if (typeof responseToUser === 'string') {
      app.ask(responseToUser); // Google Assistant response
    } else {
      // If speech or displayText is defined use it to respond
      let googleResponse = app.buildRichResponse().addSimpleResponse({
        speech: responseToUser.speech || responseToUser.displayText,
        displayText: responseToUser.displayText || responseToUser.speech
      });
      // Optional: Overwrite previous response with rich response
      if (responseToUser.googleRichResponse) {
        googleResponse = responseToUser.googleRichResponse;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.googleOutputContexts) {
        app.setContext(...responseToUser.googleOutputContexts);
      }
      console.log('Response to Dialogflow (AoG): ' + JSON.stringify(googleResponse));
      app.ask(googleResponse); // Send response to Dialogflow and Google Assistant
    }
  }
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse (responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      let responseJson = {};
      responseJson.speech = responseToUser; // spoken response
      responseJson.displayText = responseToUser; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      let responseJson = {};
      // If speech or displayText is defined, use it to respond (if one isn't defined use the other's value)
      responseJson.speech = responseToUser.speech || responseToUser.displayText;
      responseJson.displayText = responseToUser.displayText || responseToUser.speech;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      responseJson.data = responseToUser.data;
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      responseJson.contextOut = responseToUser.outputContexts;
      console.log('Response to Dialogflow: ' + JSON.stringify(responseJson));
      response.json(responseJson); // Send response to Dialogflow
    }
  }
}

function processV2Request (request, response) {
  let action = (request.body.queryResult.action) ? request.body.queryResult.action : 'default';
  let parameters = request.body.queryResult.parameters || {}; // https://dialogflow.com/docs/actions-and-parameters
  let inputContexts = request.body.queryResult.outputContexts; // https://dialogflow.com/docs/contexts
  let requestSource = (request.body.originalDetectIntentRequest) ? request.body.originalDetectIntentRequest.source : undefined;
  let session = (request.body.session) ? request.body.session : undefined;
  const googleAssistantRequest = 'google'; // Constant to identify Google Assistant requests
  const app = new DialogflowApp({request: request, response: response});
  const actionHandlers = {
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'input.unknown': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      sendResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
    },
    // Begin narration of the game
    'game.narrate': () => {
      // Get game info
      let game_params = inputContexts[0].parameters;
      let game = game_params.game;
      let player_count = game_params.players;
      let joker = game_params.joker !== '';
      let roles = game_params['avalon-set'];
      let isGoogle = requestSource === googleAssistantRequest;
      let speak = (isGoogle) ? '<speak>' : '';

      function isSub(short, long){
        return long.indexOf(short) != -1;
      }
      function addBreak(length, strength){
        if(isGoogle) {
          speak += '<break ';
          if(length > 0) speak += 'time="' + length + 'ms" ';
          if(strength !== '') speak += 'strength="' + strength + '" ';
          speak += '/>';
        }
      }
      function addPhrase(phrase) {
        if(isGoogle) speak += '<prosody volume="loud">' + phrase + '</prosody>'
        else speak += phrase + ' '
      }
      function addPhrase(phrase, length, strength){
        addPhrase(phrase)
        if (isGoogle) addBreak(length, strength);
      }

      addPhrase('Eyes closed and fists on the table!', 100, 'x-weak');
      addPhrase('If there\'s a problem at any time, tell me to stop.', 1900, 'normal');
      
      if (game == 'The Resistance') {
        //speak += 'Narrating The Resistance for ' + players + ' players.';
        let spy_count = player_count / 2;
        addPhrase('Spies, open your eyes.', 200, 'x-weak');
        addPhrase('You should see ' + spy_count + 'other pairs of eyes', 200, 'normal');
        addPhrase('Collaborate with your buddies, and fail 3 missions to win.', 100, 'x-weak');
        addPhrase('Spies, close your eyes.', 2000, 'strong');
      } else if (game == 'Secret Hitler') {
        //speak += 'Narrating Secret Hitler for ' + players + ' players.';
        if(player_count > 6) {
          addPhrase('Fascists, open your eyes.', 200, 'x-weak');
          addPhrase('Fascist, play Fascist cards and protect Hitler.', 100, 'weak');
          addPhrase('Hitler, play safe and become Chancellor when the time is right.', 100, 'weak');
          
          addPhrase('Fascists, close your eyes.', 2000, 'strong');
        } else {
          addPhrase('Fascists who are not Hitler, open your eyes.', 500, 'x-weak');
          addPhrase('Your job is to play Fascist cards and protect Hitler.', 100, 'normal');
          
          addPhrase('Hitler, stick your thumb up so that your Fascists can see you.', 100, 'weak');
          addPhrase('Stay hidden and become Chancellor when the time is right.', 100, 'weak');
          
          addPhrase('Fascists, close your eyes.', 100, 'normal');
          addPhrase('Hitler, lower your thumb.', 2000, 'strong');
        }
      } else if (game == 'The Resistance: Avalon') {
        //speak += 'Narrating Avalon for ' + players + ' players.';
        let minion_count = 2;
        if (player_count > 6) minion_count++;
        if (player_count > 9) minion_count++;
        
        let hasPercival = isSub('Percival', roles);
        let hasMorgana = isSub('Morgana', roles);
        let hasOberon = isSub('Oberon', roles);
        let hasMordred = isSub('Mordred', roles);
        
        let k_bads = minion_count;
        if (hasOberon) k_bads--;
        let v_bads = minion_count;
        if (hasMordred) v_bads--;
          
        /// MINIONS
        
        if (hasOberon) addPhrase('Minions who are not Oberon, raise your thumbs and open your eyes.', 1000, 'normal');
        else addPhrase('Minions, raise your thumbs and open your eyes.', 1000, 'normal');
      
        addPhrase('You should see ' + k_bads + 'thumbs up, including your own.', 4000, 'normal');
        addPhrase('Minions, lower your thumbs and close your eyes.', 3000, 'strong');
        
        /// MERLIN
      
        if (hasMordred) addPhrase('Minions who are not Mordred, raise your thumbs for Merlin.', 1000, 'normal');
        else addPhrase('Minions, raise your thumbs for Merlin.', 1000, 'normal');
      
        addPhrase('Merlin, open your eyes.', 500, 'weak');
        addPhrase('You should see ' + v_bads + ' thumbs. Each of them can fail missions.', 3000, 'strong')
        addPhrase('Merlin, close your eyes.', 1000, 'normal');
        addPhrase('Minions, lower your thumbs', 3000, 'normal');
        
        /// PERCIVAL
      
        if (hasPercival) {
          if (hasMorgana) {
            addPhrase('Merlin and Morgana, raise your thumbs.', 3000, 'normal');
            addPhrase('Percival, open your eyes.', 200, 'normal');
            addPhrase('You should see 2 thumbs.', 200, 'normal');
            addPhrase('One is Merlin, one is Morgana.', 200, 'weak');
            addPhrase('Figure out who\'s who.', 1500, 'normal');
          } else {
            addPhrase('Merlin, raise your thumb.', 3000, 'normal');
            addPhrase('Percival, open your eyes.', 200, 'normal');
            addPhrase('You should see 1 thumb.', 200, 'normal');
            addPhrase('This is Merlin, one is Morgana.', 2000, 'normal');
          }
          addPhrase('Lower your thumbs and close your eyes.', 3000, 'strong');
        }
      }
      
      addPhrase('Everyone, open your eyes.', 0, 'strong');
      if (isGoogle) speak += '</speak>';

      console.log('speak: ', speak);
      let responseToUser = { fulfillmentText: speak };
      sendResponse(responseToUser);
    },
    // Default handler for unknown or undefined actions
    'default': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        let responseToUser = {
          speech: 'This is the default Google response',
          text: 'This is the default Google response' // displayed response
        };
        sendGoogleResponse(responseToUser);
      } else {
        let responseToUser = { fulfillmentText: 'This is the default response' };
        sendResponse(responseToUser);
      }
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
  // Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
  function sendGoogleResponse (responseToUser) {
    if (typeof responseToUser === 'string') {
      app.ask(responseToUser); // Google Assistant response
    } else {
      // If speech or displayText is defined use it to respond
      let googleResponse = app.buildRichResponse().addSimpleResponse({
        speech: responseToUser.speech || responseToUser.text,
        displayText: responseToUser.text || responseToUser.speech
      });
      // Optional: Overwrite previous response with rich response
      if (responseToUser.googleRichResponse) {
        googleResponse = responseToUser.googleRichResponse;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.googleOutputContexts) {
        app.setContext(...responseToUser.googleOutputContexts);
      }
      console.log('Response to Dialogflow (AoG): ' + JSON.stringify(googleResponse));
      //app.ask(googleResponse); // Send response to Dialogflow and Google Assistant
      app.ask({
        speech: responseToUser.speech || responseToUser.text,
        displayText: responseToUser.text || responseToUser.speech
      });
    }
  }
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse (responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      let responseJson = {fulfillmentText: responseToUser}; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      let responseJson = {};
      // Define the text response
      responseJson.fulfillmentText = responseToUser.fulfillmentText;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      if (responseToUser.fulfillmentMessages) {
        responseJson.fulfillmentMessages = responseToUser.fulfillmentMessages;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.outputContexts) {
        responseJson.outputContexts = responseToUser.outputContexts;
      }
      // Send the response to Dialogflow
      console.log('Response to Dialogflow: ' + JSON.stringify(responseJson));
      response.json(responseJson);
    }
  }
}

/*
* Example rich responses
*/
const app = new DialogflowApp();
const googleRichResponse = app.buildRichResponse()

const richResponsesV1 = {
  'slack': {
    'text': 'This is a text response for Slack.',
    'attachments': [
      {
        'title': 'Title: this is a title',
        'title_link': 'https://assistant.google.com/',
        'text': 'This is an attachment.  Text in attachments can include \'quotes\' and most other unicode characters including emoji 📱.  Attachments also upport line\nbreaks.',
        'image_url': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
        'fallback': 'This is a fallback.'
      }
    ]
  },
  'facebook': {
    'attachment': {
      'type': 'template',
      'payload': {
        'template_type': 'generic',
        'elements': [
          {
            'title': 'Title: this is a title',
            'image_url': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
            'subtitle': 'This is a subtitle',
            'default_action': {
              'type': 'web_url',
              'url': 'https://assistant.google.com/'
            },
            'buttons': [
              {
                'type': 'web_url',
                'url': 'https://assistant.google.com/',
                'title': 'This is a button'
              }
            ]
          }
        ]
      }
    }
  }
};
const richResponsesV2 = [
  {
    'platform': 'ACTIONS_ON_GOOGLE',
    'simple_responses': {
      'simple_responses': [
        {
          'text_to_speech': 'Spoken simple response',
          'display_text': 'Displayed simple response'
        }
      ]
    }
  }
];
