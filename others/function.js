const { 
  v1: uuidv1,
  v4: uuidv4,
} = require('uuid');

const bcrypt = require('bcryptjs')
const salt = bcrypt.genSaltSync(10);

// sample payload to response
const payload = JSON.stringify({
  title: '! subscribe success !',
  body: 'This is my body',
  icon: 'assets/icons/icon-384x384.png',
  actions: [
      { action: 'bar', title: 'Focus last' },
  ],
  data: {
      onActionClick: {
          default: { operation: 'openWindow' },
          bar: {
              operation: 'focusLastFocusedOrOpen',
              url: '/signin',
          },
         
      },
  },
});

const options = {
  vapidDetails: {
    subject: 'mailto:example_email@example.com',
    publicKey: process.env.PRIVATE_KEY,
    privateKey: process.env.FULL_CHAIN,
  },
  TTL: 60,
};


module.exports = {

   success_response: function(message, data){
      return {
        status: true,
        message: message,
        data: data
      };
    },
    
   fail_response: function(message, data){
      return {
        status: false,
        message: message,
        data: data
      };
    },
    uuidv4,
    bcrypt,
    salt,
  };

  