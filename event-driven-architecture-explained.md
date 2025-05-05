# Event-Driven Architecture with Solace PubSub+: How It All Works

This document explains the complete flow of our event-driven e-commerce system implemented using Solace PubSub+.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Event Flow Explained](#event-flow-explained)
3. [Topic Hierarchy and Routing](#topic-hierarchy-and-routing)
4. [Message Structure](#message-structure)
5. [Publisher Implementation](#publisher-implementation)
6. [Subscriber Implementation](#subscriber-implementation)
7. [Complete Order Flow Example](#complete-order-flow-example)
8. [Event Mesh Capabilities](#event-mesh-capabilities)
9. [Comparison with Traditional Architectures](#comparison-with-traditional-architectures)
10. [Scaling and Production Considerations](#scaling-and-production-considerations)

## Architecture Overview

Our e-commerce system uses an event-driven architecture (EDA) with Solace PubSub+ as the event broker. In this architecture:

- **Publishers** emit events when something happens (e.g., order created, payment processed)
- **Subscribers** listen for events they're interested in and react accordingly
- **Solace PubSub+** routes events from publishers to subscribers based on topics

```
┌─────────────┐     ┌───────────────────┐     ┌─────────────────┐
│             │     │                   │     │                 │
│ Publishers  │────▶│  Solace PubSub+   │────▶│  Subscribers    │
│             │     │  Event Broker     │     │                 │
└─────────────┘     └───────────────────┘     └─────────────────┘
     │                       ▲                        │
     │                       │                        │
     └───────────────────────┴────────────────────────┘
                 Event-Driven Communication
```

## Event Flow Explained

Here's how events flow through our system:

1. **Event Generation**: A business event occurs (e.g., customer places an order)
2. **Event Publishing**: The publisher creates an event message and publishes it to a specific topic
3. **Event Routing**: Solace routes the event to all subscribers of that topic
4. **Event Processing**: Subscribers receive the event and process it according to their business logic
5. **Cascading Events**: Processing one event may trigger the publication of new events

### Example Flow: Order Processing

```
┌─────────────┐     ┌───────────────────┐     ┌─────────────────┐
│ Order       │     │                   │     │ Inventory       │
│ Service     │────▶│                   │────▶│ Service         │
│             │     │                   │     │                 │
└─────────────┘     │                   │     └─────────────────┘
                    │                   │
┌─────────────┐     │  Solace PubSub+   │     ┌─────────────────┐
│ Payment     │────▶│  Event Broker     │────▶│ Shipping        │
│ Service     │     │                   │     │ Service         │
│             │     │                   │     │                 │
└─────────────┘     │                   │     └─────────────────┘
                    │                   │
┌─────────────┐     │                   │     ┌─────────────────┐
│ Customer    │────▶│                   │────▶│ Analytics       │
│ Service     │     │                   │     │ Service         │
│             │     │                   │     │                 │
└─────────────┘     └───────────────────┘     └─────────────────┘
```

## Topic Hierarchy and Routing

Solace uses hierarchical topics for event routing. Our topic structure follows this pattern:

```
<domain>/<entity>/<action>
```

For example:
- `ecommerce/orders/created`
- `ecommerce/payments/authorized`
- `ecommerce/inventory/low-stock`

### Topic Wildcards

Subscribers can use wildcards to subscribe to multiple topics:

- **Single-level wildcard** (*): Matches exactly one level
  - `ecommerce/orders/*` matches `ecommerce/orders/created`, `ecommerce/orders/updated`, etc.

- **Multi-level wildcard** (>): Matches zero or more levels
  - `ecommerce/>` matches all topics in the ecommerce domain

### Topic Routing Example

```
Topic: ecommerce/orders/created
┌─────────────────────────────────────┐
│ Solace PubSub+ Event Broker         │
│                                     │
│  ┌─────────────┐                    │
│  │ Topic Space │                    │
│  │             │                    │
│  │ ecommerce/  │                    │
│  │  orders/    │                    │
│  │   created   │                    │
│  └──────┬──────┘                    │
│         │                           │
└─────────┼───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│ Subscribers                          │
│                                     │
│ ✓ Sub1: ecommerce/orders/created    │
│ ✓ Sub2: ecommerce/orders/*          │
│ ✓ Sub3: ecommerce/>                 │
│ ✗ Sub4: ecommerce/payments/*        │
└─────────────────────────────────────┘
```

## Message Structure

Our event messages follow a consistent structure:

```json
{
  "eventType": "OrderCreated",
  "timestamp": "2025-05-05T18:04:07.009Z",
  "data": {
    "orderId": "ord-1620234567-1234",
    "customerId": "c101",
    "customerName": "Alice Johnson",
    "orderDate": "2025-05-05T18:04:07.009Z",
    "items": [
      {
        "productId": "p1001",
        "productName": "Smartphone",
        "quantity": 1,
        "unitPrice": 699.99,
        "subtotal": 699.99
      }
    ],
    "totalAmount": 699.99,
    "status": "created"
  }
}
```

### Message Properties

In addition to the message payload, we use Solace message properties:

- **User Properties**: Custom metadata about the event
  - `contentType`: The format of the message (e.g., "application/json")
  - `correlationId`: ID to correlate related events
  - `timestamp`: When the event was created

## Publisher Implementation

Our publisher implementation follows these steps:

1. **Connect to Solace**: Establish a session with the Solace broker
2. **Create Event**: Generate an event with the appropriate data
3. **Set Topic**: Determine the appropriate topic for the event
4. **Publish Event**: Send the event to Solace for routing

### Key Publisher Code

```javascript
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
      
      // Add user properties
      const userPropertyMap = new solace.SDTMapContainer();
      userPropertyMap.addField("contentType", solace.SDTFieldType.STRING, "application/json");
      
      // Add correlation ID if available
      if (eventData.correlationId) {
        userPropertyMap.addField("correlationId", solace.SDTFieldType.STRING, eventData.correlationId);
      }
      
      // Set user properties on the message
      message.setUserPropertyMap(userPropertyMap);
      
      // Send the message
      session.send(message);
      
    } catch (error) {
      console.log(`Error publishing event to ${topicName}: ${error.toString()}`);
    }
  }
};
```

## Subscriber Implementation

Our subscriber implementation follows these steps:

1. **Connect to Solace**: Establish a session with the Solace broker
2. **Subscribe to Topics**: Register interest in specific topics or patterns
3. **Process Events**: Handle incoming events based on their topic and content

### Key Subscriber Code

```javascript
// Subscribe to a topic
subscriber.subscribe = function (topicName, description) {
  if (session !== null) {
    console.log(`Subscribing to topic: ${topicName} (${description})`);
    try {
      session.subscribe(
        solace.SolclientFactory.createTopicDestination(topicName),
        true, // generate confirmation when subscription is added successfully
        topicName, // use topic name as correlation key
        10000 // 10 seconds timeout for this operation
      );
    } catch (error) {
      console.log('Error subscribing to topic: ' + error.toString());
    }
  }
};

// Process received messages based on topic
subscriber.processMessage = function (message) {
  const topic = message.getDestination().getName();
  
  try {
    // Parse the message content as JSON
    const content = JSON.parse(message.getBinaryAttachment());
    
    // Process the event based on its topic and content
    if (topic.startsWith('ecommerce/orders/')) {
      // Handle order events
    } else if (topic.startsWith('ecommerce/payments/')) {
      // Handle payment events
    }
    
  } catch (e) {
    console.log(`Error parsing message on topic ${topic}: ${e.message}`);
  }
};
```

## Complete Order Flow Example

Let's trace a complete order flow through our system:

1. **Customer Registration**
   - Event: `ecommerce/customers/registered`
   - Subscribers: Customer service, Analytics

2. **Order Creation**
   - Event: `ecommerce/orders/created`
   - Subscribers: Inventory service, Payment service, Analytics

3. **Payment Processing**
   - Event: `ecommerce/payments/authorized`
   - Subscribers: Order service, Customer service, Analytics

4. **Order Update**
   - Event: `ecommerce/orders/updated`
   - Subscribers: Customer service, Shipping service, Analytics

5. **Inventory Update**
   - Event: `ecommerce/inventory/updated`
   - Subscribers: Procurement service, Analytics

### Sequence Diagram

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Customer │  │  Order   │  │ Payment  │  │Inventory │  │ Shipping │  │Analytics │
│ Service  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │             │             │
     │ Register    │             │             │             │             │
     │─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼──▶
     │             │             │             │             │             │
     │             │ Create Order│             │             │             │
     │             │─────────────┼─────────────┼─────────────┼─────────────┼──▶
     │             │             │             │             │             │
     │             │             │ Process     │             │             │
     │             │             │ Payment     │             │             │
     │             │             │─────────────┼─────────────┼─────────────┼──▶
     │             │             │             │             │             │
     │             │ Update      │             │             │             │
     │             │ Order       │             │             │             │
     │             │─────────────┼─────────────┼─────────────┼─────────────┼──▶
     │             │             │             │             │             │
     │             │             │             │ Update      │             │
     │             │             │             │ Inventory   │             │
     │             │             │             │─────────────┼─────────────┼──▶
     │             │             │             │             │             │
     │             │             │             │             │ Ship Order  │
     │             │             │             │             │─────────────┼──▶
     │             │             │             │             │             │
┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐
│ Customer │  │  Order   │  │ Payment  │  │Inventory │  │ Shipping │  │Analytics │
│ Service  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

## Event Mesh Capabilities

While our demo uses a single Solace broker, in a production environment, you would deploy an event mesh:

```
┌─────────────────────────┐   ┌─────────────────────────┐
│                         │   │                         │
│  North America Region   │   │    Europe Region        │
│  ┌─────────────────┐    │   │   ┌─────────────────┐   │
│  │                 │    │   │   │                 │   │
│  │  Solace Broker  │◄───┼───┼──►│  Solace Broker  │   │
│  │                 │    │   │   │                 │   │
│  └─────────────────┘    │   │   └─────────────────┘   │
│          ▲              │   │           ▲             │
│          │              │   │           │             │
│          ▼              │   │           ▼             │
│  ┌─────────────────┐    │   │   ┌─────────────────┐   │
│  │  Applications   │    │   │   │  Applications   │   │
│  └─────────────────┘    │   │   └─────────────────┘   │
│                         │   │                         │
└─────────────────────────┘   └─────────────────────────┘
            │                             │
            └─────────────┬───────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │                         │
              │     Asia Region         │
              │   ┌─────────────────┐   │
              │   │                 │   │
              │   │  Solace Broker  │   │
              │   │                 │   │
              │   └─────────────────┘   │
              │           ▲             │
              │           │             │
              │           ▼             │
              │   ┌─────────────────┐   │
              │   │  Applications   │   │
              │   └─────────────────┘   │
              │                         │
              └─────────────────────────┘
```

In an event mesh:

1. **Events flow seamlessly** between regions and environments
2. **Local processing** happens within each region for low latency
3. **Global events** are propagated across the entire mesh
4. **Different protocols** can be used in different parts of the mesh

## Comparison with Traditional Architectures

### Event-Driven vs. Request-Response

| Aspect | Event-Driven (Solace) | Request-Response (REST) |
|--------|------------------------|-------------------------|
| Coupling | Loose coupling | Tight coupling |
| Communication | Asynchronous | Synchronous |
| Scalability | Highly scalable | Limited by request handling |
| Resilience | High (can buffer events) | Lower (requires both services) |
| Discovery | Topic-based | Endpoint-based |
| Flow | Reactive | Imperative |

### Event-Driven vs. Message Queue

| Aspect | Event-Driven (Solace) | Message Queue (e.g., RabbitMQ) |
|--------|------------------------|--------------------------------|
| Routing | Content/topic-based | Queue-based |
| Consumers | Multiple subscribers | Competing consumers |
| Wildcards | Hierarchical wildcards | Limited or none |
| Persistence | Optional | Typically required |
| Topology | Mesh | Hub and spoke |

## Scaling and Production Considerations

For a production deployment, consider:

1. **High Availability**: Deploy redundant Solace brokers
2. **Guaranteed Messaging**: Use persistent delivery for critical events
3. **Dead Letter Queues**: Handle failed message processing
4. **Monitoring**: Track event flows and broker health
5. **Schema Registry**: Ensure consistent event formats
6. **Access Control**: Secure topics and queues
7. **Event Versioning**: Handle changes to event structures
8. **Disaster Recovery**: Plan for regional outages

### Scaling Patterns

- **Horizontal Scaling**: Add more brokers to the event mesh
- **Topic Partitioning**: Distribute load across topics
- **Consumer Groups**: Scale subscribers independently
- **Event Sourcing**: Store events for replay and recovery
- **CQRS**: Separate read and write operations

---

This document provides a comprehensive overview of how our event-driven architecture works with Solace PubSub+. By understanding these concepts, you can leverage the full power of event-driven messaging in your applications.
