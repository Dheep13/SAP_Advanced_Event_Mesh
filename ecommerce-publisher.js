/*
 * Enhanced publisher application that simulates an e-commerce system
 * generating various events on different topics.
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
let publisher = {};

// Sample data for our simulation
const products = [
  { id: 'p1001', name: 'Smartphone', category: 'electronics', price: 699.99, stock: 50 },
  { id: 'p1002', name: 'Laptop', category: 'electronics', price: 1299.99, stock: 25 },
  { id: 'p1003', name: 'Headphones', category: 'electronics', price: 149.99, stock: 100 },
  { id: 'p1004', name: 'Running Shoes', category: 'sports', price: 89.99, stock: 75 },
  { id: 'p1005', name: 'Coffee Maker', category: 'home', price: 79.99, stock: 30 }
];

const customers = [
  { id: 'c101', name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 'c102', name: 'Bob Smith', email: 'bob@example.com' },
  { id: 'c103', name: 'Carol Williams', email: 'carol@example.com' },
  { id: 'c104', name: 'David Brown', email: 'david@example.com' }
];

// Helper function to generate a random integer
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get a random item from an array
function getRandomItem(array) {
  return array[getRandomInt(0, array.length - 1)];
}

// Helper function to generate a unique order ID
function generateOrderId() {
  return 'ord-' + Date.now() + '-' + getRandomInt(1000, 9999);
}

// Error handling
publisher.handleError = function (error) {
  console.log('Error: ' + error.toString());
};

// Connection success callback
publisher.connectSuccess = function () {
  console.log('Successfully connected to Solace message router!');
  publisher.startSimulation();
};

// Connection failure callback
publisher.connectFailure = function (error) {
  console.log('Failed to connect to Solace message router: ' + error.toString());
};

// Publish a message to a specific topic
publisher.publishEvent = function (topicName, eventData) {
  if (session !== null) {
    try {
      // Create a message
      let message = solace.SolclientFactory.createMessage();

      // Set the destination topic
      message.setDestination(solace.SolclientFactory.createTopicDestination(topicName));

      // Set message properties
      message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);

      // Convert event data to JSON string and set as binary attachment
      const jsonData = JSON.stringify(eventData);
      message.setBinaryAttachment(jsonData);

      // Add user properties to indicate content type and other metadata
      const userPropertyMap = new solace.SDTMapContainer();
      userPropertyMap.addField("contentType", solace.SDTFieldType.STRING, "application/json");

      // Add correlation ID if available
      if (eventData.correlationId) {
        userPropertyMap.addField("correlationId", solace.SDTFieldType.STRING, eventData.correlationId);
      }

      // Add timestamp
      userPropertyMap.addField("timestamp", solace.SDTFieldType.STRING, Date.now().toString());

      // Set user properties on the message
      message.setUserPropertyMap(userPropertyMap);

      // Send the message
      session.send(message);

      console.log(`Published event to ${topicName}:`);
      console.log(JSON.stringify(eventData, null, 2));
      console.log('-----------------------------------');
    } catch (error) {
      console.log(`Error publishing event to ${topicName}: ${error.toString()}`);
    }
  } else {
    console.log('Cannot publish because not connected to Solace message router.');
  }
};

// Simulate a customer registration event
publisher.simulateCustomerRegistration = function () {
  const customerId = 'c' + getRandomInt(200, 999);
  const event = {
    eventType: 'CustomerRegistered',
    timestamp: new Date().toISOString(),
    data: {
      customerId: customerId,
      name: 'New Customer ' + customerId,
      email: `customer${customerId}@example.com`,
      registrationDate: new Date().toISOString()
    }
  };

  publisher.publishEvent(config.topics.customers.registered, event);
};

// Simulate an inventory update event
publisher.simulateInventoryUpdate = function () {
  const product = getRandomItem(products);
  const stockChange = getRandomInt(-10, 20);
  const newStock = Math.max(0, product.stock + stockChange);

  const event = {
    eventType: 'InventoryUpdated',
    timestamp: new Date().toISOString(),
    data: {
      productId: product.id,
      productName: product.name,
      previousStock: product.stock,
      currentStock: newStock,
      change: stockChange
    }
  };

  publisher.publishEvent(config.topics.inventory.updated, event);

  // If stock is low, publish a low stock event
  if (newStock > 0 && newStock <= 10) {
    const lowStockEvent = {
      eventType: 'LowStock',
      timestamp: new Date().toISOString(),
      data: {
        productId: product.id,
        productName: product.name,
        currentStock: newStock,
        threshold: 10
      }
    };

    publisher.publishEvent(config.topics.inventory.lowStock, lowStockEvent);
  }

  // If out of stock, publish an out of stock event
  if (newStock === 0) {
    const outOfStockEvent = {
      eventType: 'OutOfStock',
      timestamp: new Date().toISOString(),
      data: {
        productId: product.id,
        productName: product.name,
        lastSold: new Date().toISOString()
      }
    };

    publisher.publishEvent(config.topics.inventory.outOfStock, outOfStockEvent);
  }

  // Update the product stock for future events
  product.stock = newStock;
};

// Simulate an order creation event
publisher.simulateOrderCreation = function () {
  const customer = getRandomItem(customers);
  const orderId = generateOrderId();
  const orderItems = [];
  const itemCount = getRandomInt(1, 3);

  let totalAmount = 0;

  // Add random items to the order
  for (let i = 0; i < itemCount; i++) {
    const product = getRandomItem(products);
    const quantity = getRandomInt(1, 3);

    orderItems.push({
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      unitPrice: product.price,
      subtotal: product.price * quantity
    });

    totalAmount += product.price * quantity;
  }

  const event = {
    eventType: 'OrderCreated',
    timestamp: new Date().toISOString(),
    data: {
      orderId: orderId,
      customerId: customer.id,
      customerName: customer.name,
      orderDate: new Date().toISOString(),
      items: orderItems,
      totalAmount: totalAmount,
      status: 'created'
    }
  };

  publisher.publishEvent(config.topics.orders.created, event);

  // Simulate a payment authorization event
  setTimeout(() => {
    const paymentSuccess = Math.random() > 0.1; // 90% success rate

    if (paymentSuccess) {
      const paymentEvent = {
        eventType: 'PaymentAuthorized',
        timestamp: new Date().toISOString(),
        correlationId: orderId,
        data: {
          orderId: orderId,
          customerId: customer.id,
          amount: totalAmount,
          paymentMethod: 'credit_card',
          transactionId: 'tx-' + Date.now()
        }
      };

      publisher.publishEvent(config.topics.payments.authorized, paymentEvent);

      // Update order status
      const orderUpdateEvent = {
        eventType: 'OrderUpdated',
        timestamp: new Date().toISOString(),
        correlationId: orderId,
        data: {
          orderId: orderId,
          previousStatus: 'created',
          currentStatus: 'paid',
          updateReason: 'payment_received'
        }
      };

      publisher.publishEvent(config.topics.orders.updated, orderUpdateEvent);
    } else {
      // Payment failed
      const paymentFailedEvent = {
        eventType: 'PaymentFailed',
        timestamp: new Date().toISOString(),
        correlationId: orderId,
        data: {
          orderId: orderId,
          customerId: customer.id,
          amount: totalAmount,
          paymentMethod: 'credit_card',
          failureReason: 'insufficient_funds'
        }
      };

      publisher.publishEvent(config.topics.payments.failed, paymentFailedEvent);

      // Cancel the order
      const orderCancelledEvent = {
        eventType: 'OrderCancelled',
        timestamp: new Date().toISOString(),
        correlationId: orderId,
        data: {
          orderId: orderId,
          previousStatus: 'created',
          cancellationReason: 'payment_failed'
        }
      };

      publisher.publishEvent(config.topics.orders.cancelled, orderCancelledEvent);
    }
  }, 2000);
};

// Start the simulation
publisher.startSimulation = function () {
  console.log('Starting e-commerce event simulation...');

  // Simulate events at random intervals
  setInterval(() => {
    const eventType = getRandomInt(1, 3);

    switch (eventType) {
      case 1:
        publisher.simulateCustomerRegistration();
        break;
      case 2:
        publisher.simulateInventoryUpdate();
        break;
      case 3:
        publisher.simulateOrderCreation();
        break;
    }
  }, 5000); // Generate a new event every 5 seconds
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
  console.log('E-commerce event publisher connecting to Solace message router...');
  publisher.connect();

  // Set up cleanup on exit
  process.on('SIGINT', function () {
    console.log('Shutting down...');
    publisher.disconnect();
    process.exit();
  });
};

main();
