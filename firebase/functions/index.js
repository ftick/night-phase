
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
      
      // 
      let isGoogle = requestSource === googleAssistantRequest;
      let speak = (isGoogle) ? '<speak>' : '';
      
      // Get game info
      let game_params = inputContexts[0].parameters;
      let game = game_params.game;
      let player_count = game_params.players;
      let joker = game_params.joker !== '';
      let roles = game_params['avalon-set'];
      if (player_count < 5 || player_count > 10) player_count = 5; 
      
      let phrase = { length: 100, strength: 'weak' }
      let fast_sentence = { length: 200, strength: 'normal' }
      let long_sentence = { length: 1500, strength: 'normal' }
      let paragraph = { length: 2000, strength: 'strong' }
      
      let PHRASE = 'phrase';
      let FAST = 'fast';
      let LONG = 'long';
      let PARAGRAPH = 'paragraph';

      function isSub(short, long){
        return long.indexOf(short) != -1;
      }
      
      function addBreak(info){
        
        if(!isGoogle) {}
        
        let length = '';
        let strength = '';
        
        if (info == PHRASE) {
          length = phrase.length;
          strength = phrase.strength;
        } else if (info == FAST) {
          length = fast_sentence.length;
          strength = fast_sentence.strength;
        } else if (info == LONG) {
          length = long_sentence.length;
          strength = long_sentence.strength;
        } else if (info == PARAGRAPH) {
          length = paragraph.length;
          strength = paragraph.strength;
        }
        
        speak += '<break ';
        if(length > 0) speak += 'time="' + length + 'ms" ';
        if(strength !== '') speak += 'strength="' + strength + '" ';
        speak += '/>';
          
        if (info == PARAGRAPH) speak += '\n'
      }
      
      function addPhraseImpl(phrase) {
        if(isGoogle) speak += '<prosody volume="loud">' + phrase + '</prosody>'
        else speak += phrase + ' '
      }
      
      function addPhrase(phrase, info){ // too many arguments here
        addPhraseImpl(phrase)
        if (isGoogle) addBreak(info);
      }

      // BEGIN NARRATION
      
      addPhrase('Eyes closed and fists on the table!', PHRASE);
      addPhrase('If there\'s a problem at any time, tell me to stop.', LONG);
      
      /* -----------------------------------------------------------------------
       *                            THE RESISTANCE
       * ----------------------------------------------------------------------- */
      
      if (game == 'The Resistance') {
        
        let spy_count = 2;
        if(player_count > 6) spy_count++;
        if(player_count > 8) spy_count++;
        
        addPhrase('Spies, open your eyes.', PHRASE);
        addPhrase('You should see ' + (spy_count-1).toString() + ' other pairs of eyes', FAST);
        addPhrase('Collaborate with your buddies, and fail 3 missions to win.', PHRASE);
        addPhrase('Spies, close your eyes.', PARAGRAPH);
      
      /* -----------------------------------------------------------------------
       *                            SECRET HITLER
       * ----------------------------------------------------------------------- */
      
      } else if (game == 'Secret Hitler') {
        
        let spy_count = 2;
        if(player_count > 6) spy_count++;
        if(player_count > 8) spy_count++;
        
        if(spy_count < 3) {
          
          addPhrase('Fascists, open your eyes.', FAST);
          
          addPhrase('You should see one other pair of eyes.', FAST);
          
          addPhrase('Fascist, play Fascist cards and protect Hitler.', PHRASE);
          addPhrase('Hitler, play safe and become Chancellor when the time is right.', PHRASE);
          
          addPhrase('Fascists, close your eyes.', PARAGRAPH);
          
        } else {
          
          addPhrase('Fascists who are not Hitler, open your eyes.', FAST);
          addPhrase('You should see ' + (spy_count-1).toString() + ' other pairs of eyes.', FAST);
          addPhrase('Your job is to play Fascist cards and protect Hitler.', LONG);
          
          addPhrase('Hitler, stick your thumb up so that your Fascists can see you.', LONG);
          addPhrase('Stay hidden and become Chancellor when the time is right.', PHRASE);
          
          addPhrase('Fascists, close your eyes.', FAST);
          addPhrase('Hitler, lower your thumb.', LONG);
        }
      
      /* -----------------------------------------------------------------------
       *                            THE RESISTANCE: AVALON
       * ----------------------------------------------------------------------- */
      
      } else if (game == 'The Resistance: Avalon') {
        
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
        
        if (hasOberon) addPhrase('Minions who are not Oberon, raise your thumbs and open your eyes.', FAST);
        else addPhrase('Minions, raise your thumbs and open your eyes.', FAST);
      
        addPhrase('You should see ' + k_bads + ' thumbs up, including your own.', LONG);
        addPhrase('Minions, lower your thumbs and close your eyes.', PARAGRAPH);
        
        /// MERLIN
      
        if (hasMordred) addPhrase('Minions who are not Mordred, raise your thumbs for Merlin.', PHRASE);
        else addPhrase('Minions, raise your thumbs for Merlin.', FAST);
      
        addPhrase('Merlin, open your eyes.', PHRASE);
        addPhrase('You should see ' + v_bads + ' thumbs. Each of them can fail missions.', PARAGRAPH);
        
        addPhrase('Merlin, close your eyes.', FAST);
        addPhrase('Minions, lower your thumbs', LONG);
        
        /// PERCIVAL
      
        if (hasPercival) {
          
          if (hasMorgana) {
            
            addPhrase('Merlin and Morgana, raise your thumbs.', LONG);
            addPhrase('Percival, open your eyes.', FAST);
            addPhrase('You should see 2 thumbs.', FAST);
            addPhrase('One is Merlin, one is Morgana.', PHRASE);
            addPhrase('Figure out who\'s who.', PARAGRAPH);
            
          } else {
            
            addPhrase('Merlin, raise your thumb.', LONG);
            addPhrase('Percival, open your eyes.', FAST);
            addPhrase('You should see 1 thumb.', FAST);
            addPhrase('This is Merlin, one is Morgana.', PHRASE);
          }
          
          addPhrase('Lower your thumbs and close your eyes.', PARAGRAPH);
        }
      }
      
      // FINISH NARRATION
      addPhrase('Everyone, open your eyes.', PARAGRAPH);
      if (isGoogle) speak += '</speak>';
      
      // LOG/SEND NARRATION
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

/* Example rich responses

const app = new DialogflowApp();
const googleRichResponse = app.buildRichResponse()

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
*/