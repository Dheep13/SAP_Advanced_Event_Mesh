/*
 * A simple subscriber application that connects to a Solace message router and subscribes
 * to messages on a topic.
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
let subscriber = {};
let subscribed = false;

// Error handling
subscriber.handleError = function (error) {
  console.log('Error: ' + error.toString());
};

// Connection success callback
subscriber.connectSuccess = function () {
  console.log('Successfully connected to Solace message router!');
  subscriber.subscribe();
};

// Connection failure callback
subscriber.connectFailure = function (error) {
  console.log('Failed to connect to Solace message router: ' + error.toString());
};

// Subscribe to topic
subscriber.subscribe = function () {
  if (session !== null) {
    if (subscribed) {
      console.log('Already subscribed to "' + config.topicName + '" and ready to receive messages.');
    } else {
      console.log('Subscribing to topic: ' + config.topicName);
      try {
        session.subscribe(
          solace.SolclientFactory.createTopicDestination(config.topicName),
          true, // generate confirmation when subscription is added successfully
          config.topicName, // use topic name as correlation key
          10000 // 10 seconds timeout for this operation
        );
      } catch (error) {
        console.log('Error subscribing to topic: ' + error.toString());
      }
    }
  } else {
    console.log('Cannot subscribe because not connected to Solace message router.');
  }
};

// Unsubscribe from topic
subscriber.unsubscribe = function () {
  if (session !== null) {
    if (subscribed) {
      console.log('Unsubscribing from topic: ' + config.topicName);
      try {
        session.unsubscribe(
          solace.SolclientFactory.createTopicDestination(config.topicName),
          true, // generate confirmation when subscription is removed successfully
          config.topicName, // use topic name as correlation key
          10000 // 10 seconds timeout for this operation
        );
      } catch (error) {
        console.log('Error unsubscribing from topic: ' + error.toString());
      }
    } else {
      console.log('Cannot unsubscribe because not subscribed to the topic "' + config.topicName + '"');
    }
  } else {
    console.log('Cannot unsubscribe because not connected to Solace message router.');
  }
};

// Gracefully disconnect
subscriber.disconnect = function () {
  subscriber.unsubscribe();
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
subscriber.connect = function () {
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
      subscriber.connectSuccess();
    });
    session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
      subscriber.connectFailure(sessionEvent.infoStr);
    });
    session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
      if (session !== null) {
        session = null;
        subscribed = false;
        console.log('Session disconnected.');
      }
    });
    session.on(solace.SessionEventCode.SUBSCRIPTION_OK, function (sessionEvent) {
      if (sessionEvent.correlationKey === config.topicName) {
        subscribed = true;
        console.log('Successfully subscribed to topic: ' + config.topicName);
        console.log('Waiting for messages...');
      }
    });
    session.on(solace.SessionEventCode.SUBSCRIPTION_ERROR, function (sessionEvent) {
      console.log('Failed to subscribe to topic: ' + config.topicName);
      subscribed = false;
    });
    session.on(solace.SessionEventCode.MESSAGE, function (message) {
      console.log('Received message: "' + message.getBinaryAttachment() + '", details:\n' + 
                  'Topic: ' + message.getDestination().getName() + '\n' +
                  'Content type: ' + message.getType());
    });
    
    // Connect to Solace message router
    session.connect();
  } catch (error) {
    console.log('Error connecting to Solace message router: ' + error.toString());
  }
};

// Main function
const main = async function () {
  console.log('Subscriber connecting to Solace message router...');
  subscriber.connect();
  
  // Set up cleanup on exit
  process.on('SIGINT', function () {
    subscriber.disconnect();
    process.exit();
  });
};

main();
