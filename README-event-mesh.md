# Event-Driven Architecture with Solace PubSub+

This project demonstrates an event-driven architecture using Solace PubSub+ as the event mesh. It simulates an e-commerce system with various event types flowing through the system.

## Overview

The demo consists of:

1. **Event Publisher**: Simulates an e-commerce system generating various events
2. **Event Subscriber**: Listens to different event types using topic hierarchies and wildcards

## Event Types

The system simulates the following event types:

### Order Events
- `ecommerce/orders/created` - New order created
- `ecommerce/orders/updated` - Order status updated
- `ecommerce/orders/cancelled` - Order cancelled
- `ecommerce/orders/shipped` - Order shipped
- `ecommerce/orders/delivered` - Order delivered

### Inventory Events
- `ecommerce/inventory/updated` - Inventory levels updated
- `ecommerce/inventory/low-stock` - Product stock below threshold
- `ecommerce/inventory/out-of-stock` - Product out of stock
- `ecommerce/inventory/restocked` - Product restocked

### Customer Events
- `ecommerce/customers/registered` - New customer registration
- `ecommerce/customers/logged-in` - Customer login
- `ecommerce/customers/profile-updated` - Customer profile updated

### Payment Events
- `ecommerce/payments/authorized` - Payment authorized
- `ecommerce/payments/captured` - Payment captured
- `ecommerce/payments/failed` - Payment failed
- `ecommerce/payments/refunded` - Payment refunded

## Event Flow Example

The system simulates a complete order flow:

1. Customer registration event
2. Order creation event
3. Payment processing (success or failure)
4. Order status updates
5. Inventory updates

## Hierarchical Topics and Wildcards

This demo showcases the power of Solace's hierarchical topic structure and wildcards:

- **Exact Topic Subscriptions**: Subscribe to specific events (e.g., `ecommerce/inventory/low-stock`)
- **Single-Level Wildcards**: Subscribe to all events of a type (e.g., `ecommerce/orders/*`)
- **Multi-Level Wildcards**: Subscribe to all events in a domain (e.g., `ecommerce/>`)

## Running the Demo

### Prerequisites

- Node.js installed
- Solace PubSub+ account and connection details

### Setup

1. Update the `config.js` file with your Solace connection details
2. Install dependencies:
   ```
   npm install
   ```

### Running the Demo

1. Start the subscriber in one terminal:
   ```
   npm run ecommerce-subscriber
   ```

2. Start the publisher in another terminal:
   ```
   npm run ecommerce-publisher
   ```

3. Watch the events flow through the system!

## Event Mesh Architecture

This demo illustrates the concept of an event mesh architecture:

1. **Topic Hierarchies**: Events are organized in a hierarchical structure
2. **Content-Based Routing**: Events are routed based on their topics
3. **Publish-Subscribe Pattern**: Publishers and subscribers are decoupled
4. **Event Correlation**: Related events are correlated using IDs

In a real-world deployment, you could extend this to a true event mesh by:

1. Deploying multiple Solace brokers across different regions
2. Connecting them in a mesh topology
3. Enabling events to flow seamlessly between environments
4. Supporting different protocols and clients

## Benefits Demonstrated

This demo showcases several benefits of an event-driven architecture:

1. **Decoupling**: Publishers and subscribers are completely decoupled
2. **Flexibility**: New event types can be added without changing existing components
3. **Scalability**: Components can be scaled independently
4. **Real-time Processing**: Events are processed in real-time
5. **Event Correlation**: Related events can be correlated (e.g., order and payment events)

## Extending the Demo

You can extend this demo in several ways:

1. **Add More Event Types**: Create additional event types and handlers
2. **Implement Event Sourcing**: Store events in a database for replay
3. **Add Event Processing**: Process events to generate new events (e.g., analytics)
4. **Create a Web UI**: Visualize events in real-time
5. **Deploy Multiple Brokers**: Create a true event mesh across multiple environments
