/*
 * A simple publisher application that connects to a Solace message router and publishes messages
 * on a topic.
 */

// Import the Solace module
const solace = require('solclientjs').debug; // Using debug version for better error messages
const config = require('./config');

// Initialize the Solace API
let factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);

// Create a client session
let session = null;
let publisher = {};

// Error handling
publisher.handleError = function (error) {
  console.log('Error: ' + error.toString());
};

// Connection success callback
publisher.connectSuccess = function () {
  console.log('Successfully connected to Solace message router!');
  publisher.publish();
};

// Connection failure callback
publisher.connectFailure = function (error) {
  console.log('Failed to connect to Solace message router: ' + error.toString());
};

// Actual message publishing function
publisher.publish = function () {
  if (session !== null) {
    for (let i = 0; i < 10; i++) {
      let messageText = 'Sample message ' + i;
      let message = solace.SolclientFactory.createMessage();
      message.setDestination(solace.SolclientFactory.createTopicDestination(config.topicName));
      message.setBinaryAttachment(messageText);
      message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
      
      console.log('Publishing message: ' + messageText);
      try {
        session.send(message);
      } catch (error) {
        console.log('Error publishing message: ' + error.toString());
      }
    }
    // Disconnect after publishing
    publisher.disconnect();
  } else {
    console.log('Cannot publish because not connected to Solace message router.');
  }
};

// Disconnect from Solace message router
publisher.disconnect = function () {
  if (session !== null) {
    try {
      session.disconnect();
      console.log('Disconnected from Solace message router.');
    } catch (error) {
      console.log('Error disconnecting from Solace message router: ' + error.toString());
    }
  }
};

// Connect to Solace message router
publisher.connect = function () {
  if (session !== null) {
    console.log('Already connected to Solace message router.');
    return;
  }
  
  try {
    session = solace.SolclientFactory.createSession({
      url: config.solaceHost,
      vpnName: config.messageVpn,
      userName: config.username,
      password: config.password,
    });
    
    // Define session event listeners
    session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
      publisher.connectSuccess();
    });
    session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
      publisher.connectFailure(sessionEvent.infoStr);
    });
    session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
      if (session !== null) {
        session = null;
      }
    });
    
    // Connect to Solace message router
    session.connect();
  } catch (error) {
    console.log('Error connecting to Solace message router: ' + error.toString());
  }
};

// Main function
const main = async function () {
  console.log('Publisher connecting to Solace message router...');
  publisher.connect();
};

main();
