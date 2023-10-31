# Web Push Notifications with Couchbase server

## Getting Started

1. Clone this repository and `cd` into it.
2. Execute `npm install` to download dependencies.
3. Run `./node_modules/.bin/web-push generate-vapid-keys` to generate public/private VAPID key pair
4. Create `variables.env` in root project
5. Open `client/main.js` and `variables.env` and update them with your VAPID credentials
6. Run `node server.js` to start the Express server
7. Visit local http://localhost:8080 in your browser.
8. Visit with https https://localhost:8443 in your browser.


## `variables.env` structure
```
PORT_HTTP=8080
PORT_HTTPS=8443
PUBLIC_VAPID_KEY= generate public VAPID
PRIVATE_VAPID_KEY= generate private VAPID
PRIVATE_KEY='/var/lib/your web site/certs/key.pem'
FULL_CHAIN='/var/lib/your web site/certs/fullchain.pem'
CI_ENVIRONMENT='development'

COUCHBASE_SERVER='couchbase://localhost'
COUCHBASE_USERNAME='your couchbase username'
COUCHBASE_PASSWORD='your couchbase password'
COUCHBASE_BUCKETNAME='your bucket name'
COUCHBASE_SCOPE='your couchbase scop name'
COUCHBASE_COLLECTION='users'
COUCHBASE_COLLECTION_ADMINS='admins'
COUCHBASE_COLLECTION_SITES='sites'
COUCHBASE_COLLECTION_SESSION='session'
```

## Prerequisites

- [Node.js](https://nodejs.org/en) and npm

## Built With

- [web-push](https://github.com/web-push-libs/web-push)

