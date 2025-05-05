// Configuration for Solace connection
// Connection details from Solace Cloud
module.exports = {
  // Connection details
  solaceHost: 'wss://mr-connection-v5fuflj987h.messaging.solace.cloud:443', // Solace Cloud host URL
  messageVpn: 'test',                                                       // Your message VPN
  username: 'solace-cloud-client',                                          // Your username
  password: 'Ultimate13!',                                                  // Your password

  // Basic topic for simple demos
  topicName: 'sample/topic',

  // Queue name for persistent messaging
  queueName: 'sample_queue',

  // E-commerce event topics
  topics: {
    // Order events
    orders: {
      base: 'ecommerce/orders',
      created: 'ecommerce/orders/created',
      updated: 'ecommerce/orders/updated',
      cancelled: 'ecommerce/orders/cancelled',
      shipped: 'ecommerce/orders/shipped',
      delivered: 'ecommerce/orders/delivered'
    },

    // Inventory events
    inventory: {
      base: 'ecommerce/inventory',
      updated: 'ecommerce/inventory/updated',
      lowStock: 'ecommerce/inventory/low-stock',
      outOfStock: 'ecommerce/inventory/out-of-stock',
      restocked: 'ecommerce/inventory/restocked'
    },

    // Customer events
    customers: {
      base: 'ecommerce/customers',
      registered: 'ecommerce/customers/registered',
      loggedIn: 'ecommerce/customers/logged-in',
      updatedProfile: 'ecommerce/customers/profile-updated'
    },

    // Payment events
    payments: {
      base: 'ecommerce/payments',
      authorized: 'ecommerce/payments/authorized',
      captured: 'ecommerce/payments/captured',
      failed: 'ecommerce/payments/failed',
      refunded: 'ecommerce/payments/refunded'
    }
  }
};
