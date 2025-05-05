/*
 * Enhanced subscriber application that demonstrates the power of
 * hierarchical topics and wildcards in an event-driven architecture.
 */

// Import required modules
const solace = require('solclientjs').debug;
const config = require('./config');

// Initialize the Solace API
let factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);

// Create a client session
let session = null;
let subscriber = {};
let subscriptions = new Map();

// Error handling
subscriber.handleError = function (error) {
  console.log('Error: ' + error.toString());
};

// Connection success callback
subscriber.connectSuccess = function () {
  console.log('Successfully connected to Solace message router!');
  subscriber.setupSubscriptions();
};

// Connection failure callback
subscriber.connectFailure = function (error) {
  console.log('Failed to connect to Solace message router: ' + error.toString());
};

// Subscribe to a topic
subscriber.subscribe = function (topicName, description) {
  if (session !== null) {
    if (subscriptions.has(topicName)) {
      console.log(`Already subscribed to "${topicName}"`);
    } else {
      console.log(`Subscribing to topic: ${topicName} (${description})`);
      try {
        session.subscribe(
          solace.SolclientFactory.createTopicDestination(topicName),
          true, // generate confirmation when subscription is added successfully
          topicName, // use topic name as correlation key
          10000 // 10 seconds timeout for this operation
        );

        // Add to our subscriptions map
        subscriptions.set(topicName, {
          description: description,
          active: false
        });
      } catch (error) {
        console.log('Error subscribing to topic: ' + error.toString());
      }
    }
  } else {
    console.log('Cannot subscribe because not connected to Solace message router.');
  }
};

// Set up all our subscriptions
subscriber.setupSubscriptions = function () {
  // Subscribe to all order events
  subscriber.subscribe(config.topics.orders.base + '/*', 'All Order Events');

  // Subscribe to inventory low stock and out of stock events
  subscriber.subscribe(config.topics.inventory.lowStock, 'Low Stock Alerts');
  subscriber.subscribe(config.topics.inventory.outOfStock, 'Out of Stock Alerts');

  // Subscribe to all payment events
  subscriber.subscribe(config.topics.payments.base + '/*', 'All Payment Events');

  // Subscribe to customer registrations
  subscriber.subscribe(config.topics.customers.registered, 'New Customer Registrations');

  // Subscribe to everything in the e-commerce domain with multi-level wildcard
  subscriber.subscribe('ecommerce/>', 'All E-commerce Events (for logging)');
};

// Process received messages based on topic
subscriber.processMessage = function (message) {
  const topic = message.getDestination().getName();
  let content;

  try {
    // Parse the message content as JSON
    content = JSON.parse(message.getBinaryAttachment());
  } catch (e) {
    console.log(`Error parsing message on topic ${topic}: ${e.message}`);
    content = message.getBinaryAttachment();
  }

  // Get user properties if available
  let userProperties = {};
  try {
    const userPropertyMap = message.getUserPropertyMap();
    if (userPropertyMap) {
      const keys = userPropertyMap.getKeys();
      keys.forEach(key => {
        userProperties[key] = userPropertyMap.getField(key).getValue();
      });
    }
  } catch (e) {
    console.log(`Note: No user properties available: ${e.message}`);
  }

  // Format the timestamp for display
  const timestamp = new Date().toISOString();

  // Determine the event category based on the topic
  if (topic.startsWith(config.topics.orders.base)) {
    console.log('\n🛒 ORDER EVENT:');
    console.log(`   Topic: ${topic}`);
    console.log(`   Time: ${timestamp}`);
    console.log(`   Type: ${content.eventType}`);

    if (topic === config.topics.orders.created) {
      console.log(`   Order ID: ${content.data.orderId}`);
      console.log(`   Customer: ${content.data.customerName}`);
      console.log(`   Total: $${content.data.totalAmount.toFixed(2)}`);
      console.log(`   Items: ${content.data.items.length}`);
    } else if (topic === config.topics.orders.updated) {
      console.log(`   Order ID: ${content.data.orderId}`);
      console.log(`   Status Change: ${content.data.previousStatus} → ${content.data.currentStatus}`);
      console.log(`   Reason: ${content.data.updateReason}`);
    } else if (topic === config.topics.orders.cancelled) {
      console.log(`   Order ID: ${content.data.orderId}`);
      console.log(`   Previous Status: ${content.data.previousStatus}`);
      console.log(`   Reason: ${content.data.cancellationReason}`);
    }
  }
  else if (topic.startsWith(config.topics.inventory.base)) {
    console.log('\n📦 INVENTORY EVENT:');
    console.log(`   Topic: ${topic}`);
    console.log(`   Time: ${timestamp}`);
    console.log(`   Type: ${content.eventType}`);

    if (topic === config.topics.inventory.lowStock) {
      console.log(`   ⚠️ LOW STOCK ALERT`);
      console.log(`   Product: ${content.data.productName}`);
      console.log(`   Current Stock: ${content.data.currentStock}`);
      console.log(`   Threshold: ${content.data.threshold}`);
    } else if (topic === config.topics.inventory.outOfStock) {
      console.log(`   ❌ OUT OF STOCK ALERT`);
      console.log(`   Product: ${content.data.productName}`);
      console.log(`   Last Sold: ${content.data.lastSold}`);
    } else if (topic === config.topics.inventory.updated) {
      console.log(`   Product: ${content.data.productName}`);
      console.log(`   Stock Change: ${content.data.previousStock} → ${content.data.currentStock}`);
    }
  }
  else if (topic.startsWith(config.topics.payments.base)) {
    console.log('\n💰 PAYMENT EVENT:');
    console.log(`   Topic: ${topic}`);
    console.log(`   Time: ${timestamp}`);
    console.log(`   Type: ${content.eventType}`);

    if (topic === config.topics.payments.authorized) {
      console.log(`   ✅ PAYMENT AUTHORIZED`);
      console.log(`   Order ID: ${content.data.orderId}`);
      console.log(`   Amount: $${content.data.amount.toFixed(2)}`);
      console.log(`   Transaction ID: ${content.data.transactionId}`);
    } else if (topic === config.topics.payments.failed) {
      console.log(`   ❌ PAYMENT FAILED`);
      console.log(`   Order ID: ${content.data.orderId}`);
      console.log(`   Amount: $${content.data.amount.toFixed(2)}`);
      console.log(`   Reason: ${content.data.failureReason}`);
    }
  }
  else if (topic.startsWith(config.topics.customers.base)) {
    console.log('\n👤 CUSTOMER EVENT:');
    console.log(`   Topic: ${topic}`);
    console.log(`   Time: ${timestamp}`);
    console.log(`   Type: ${content.eventType}`);

    if (topic === config.topics.customers.registered) {
      console.log(`   ✨ NEW CUSTOMER`);
      console.log(`   ID: ${content.data.customerId}`);
      console.log(`   Name: ${content.data.name}`);
      console.log(`   Email: ${content.data.email}`);
    }
  }

  console.log('-----------------------------------');
};

// Unsubscribe from a topic
subscriber.unsubscribe = function (topicName) {
  if (session !== null) {
    if (subscriptions.has(topicName) && subscriptions.get(topicName).active) {
      console.log('Unsubscribing from topic: ' + topicName);
      try {
        session.unsubscribe(
          solace.SolclientFactory.createTopicDestination(topicName),
          true, // generate confirmation when subscription is removed successfully
          topicName, // use topic name as correlation key
          10000 // 10 seconds timeout for this operation
        );
      } catch (error) {
        console.log('Error unsubscribing from topic: ' + error.toString());
      }
    } else {
      console.log('Cannot unsubscribe because not subscribed to the topic "' + topicName + '"');
    }
  } else {
    console.log('Cannot unsubscribe because not connected to Solace message router.');
  }
};

// Unsubscribe from all topics
subscriber.unsubscribeAll = function () {
  if (session !== null) {
    subscriptions.forEach((value, topicName) => {
      if (value.active) {
        subscriber.unsubscribe(topicName);
      }
    });
  }
};

// Gracefully disconnect
subscriber.disconnect = function () {
  subscriber.unsubscribeAll();
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
        subscriptions.clear();
        console.log('Session disconnected.');
      }
    });
    session.on(solace.SessionEventCode.SUBSCRIPTION_OK, function (sessionEvent) {
      const topicName = sessionEvent.correlationKey;
      if (subscriptions.has(topicName)) {
        const subscription = subscriptions.get(topicName);
        subscription.active = true;
        console.log(`Successfully subscribed to topic: ${topicName} (${subscription.description})`);
      }
    });
    session.on(solace.SessionEventCode.SUBSCRIPTION_ERROR, function (sessionEvent) {
      const topicName = sessionEvent.correlationKey;
      console.log('Failed to subscribe to topic: ' + topicName);
      if (subscriptions.has(topicName)) {
        subscriptions.get(topicName).active = false;
      }
    });
    session.on(solace.SessionEventCode.MESSAGE, function (message) {
      subscriber.processMessage(message);
    });

    // Connect to Solace message router
    session.connect();
  } catch (error) {
    console.log('Error connecting to Solace message router: ' + error.toString());
  }
};

// Display subscription status
subscriber.showSubscriptions = function () {
  console.log('\nCurrent Subscriptions:');
  console.log('-----------------------------------');

  if (subscriptions.size === 0) {
    console.log('No subscriptions.');
  } else {
    subscriptions.forEach((value, topicName) => {
      console.log(`${value.active ? '✅' : '❌'} ${topicName} - ${value.description}`);
    });
  }

  console.log('-----------------------------------\n');
};

// Main function
const main = async function () {
  console.log('E-commerce event subscriber connecting to Solace message router...');
  subscriber.connect();

  // Set up cleanup on exit
  process.on('SIGINT', function () {
    console.log('Shutting down...');
    subscriber.disconnect();
    process.exit();
  });

  // Show subscription status every 30 seconds
  setInterval(() => {
    subscriber.showSubscriptions();
  }, 30000);
};

main();
