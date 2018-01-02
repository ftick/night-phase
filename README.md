# An Assistant app to narrate the night phase for The Resistance, Avalon, and Secret Hitler

## Setting up the Firebase Cloud Function on Windows
1. Clone the repo: https://github.com/ftick/night-phase.git
2. Open `firebase\functions` folder in Command Prompt
3. Install Firebase (`npm install -g firebase-tools`) and login (`firebase login`)
4. Install dependencies (`npm install`)
5. Run `firebase --project night-phase deploy --only functions:dialogflowFirebaseFulfillment`
