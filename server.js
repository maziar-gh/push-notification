require('dotenv').config({ path: 'variables.env' });
const app = require('./app')

var fs = require('fs')
var http = require('http')
var https = require('https')

process.setMaxListeners(0);

var server = null
    
if(process.env.CI_ENVIRONMENT == 'production'){

    var pk  = fs.readFileSync(process.env.PRIVATE_KEY, 'utf8')
    var cr = fs.readFileSync(process.env.FULL_CHAIN, 'utf8')
    var credentials = {key: pk, cert: cr}
    
    var httpsServer = https.createServer(credentials, app)
    server = httpsServer.listen(process.env.PORT_HTTPS || 8443, () => {
        console.log('App listening in port 8443 (production)')
    });

}else{

    var httpsServer = http.createServer(credentials, app)
    server = httpsServer.listen(process.env.PORT_HTTP || 8080, () => {
        console.log('App listening in port 8080 (development)')
    });
}

module.exports = server;