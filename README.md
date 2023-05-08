# Web Push Notifications with Couchbase server

## Getting Started

1. Clone this repository and `cd` into it.
2. Execute `npm install` to download dependencies.
3. Run `./node_modules/.bin/web-push generate-vapid-keys` to generate public/private VAPID key pair
4. Open `client/main.js` and `variables.env` and update them with your VAPID credentials
5. Run `node server.js` to start the Express server
6. Visit local http://localhost:8080 in your browser.
7. Visit with https https://localhost:8443 in your browser.

## Prerequisites

- [Node.js](https://nodejs.org/en) and npm

## Built With

- [web-push](https://github.com/web-push-libs/web-push)

## Licence

[MIT](https://opensource.org/licenses/MIT)

