# Solace PubSub+ Demo

This is a simple demonstration of using Solace PubSub+ (the technology behind SAP Advanced Event Mesh) for publish/subscribe messaging.

## Prerequisites

- Node.js installed on your machine  
- Access to a Solace PubSub+ broker (cloud instance, local Docker container, or hardware appliance)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Update the `config.js` file with your Solace broker connection details:

   - `solaceHost`: The URL of your Solace broker (e.g., `tcp://localhost:55555` for a local broker or a cloud URL like `tcps://mr-connection-abcde.messaging.solace.cloud:55443`)
   - `messageVpn`: Your message VPN name
   - `username`: Your client username
   - `password`: Your client password
   - `topicName`: The topic you want to use for publishing/subscribing

## Running the Demo

1. Start the subscriber in one terminal:

   ```bash
   npm run start-subscriber
   ```

2. Start the publisher in another terminal:

   ```bash
   npm run start-publisher
   ```

The publisher will send 10 messages to the specified topic, and the subscriber will receive and display these messages.

## Getting a Solace PubSub+ Instance

You have several options to get a Solace PubSub+ broker:

1. **Solace Cloud**  
   Sign up for a free tier at [console.solace.cloud](https://console.solace.cloud/)

2. **Docker**  
   Run a local instance using Docker:

   ```bash
   docker run -d -p 8080:8080 -p 55555:55555 -p 8008:8008 -p 1883:1883 -p 8000:8000 -p 5672:5672 -p 9000:9000 -p 2222:2222 --shm-size=2g --env username_admin_globalaccesslevel=admin --env username_admin_password=admin solace/solace-pubsub-standard
   ```

3. **SAP Advanced Event Mesh**  
   If you have access to SAP AEM, you can use those credentials.

## Additional Resources

- [Solace PubSub+ Documentation](https://docs.solace.com/)  
- [Solace JavaScript API Documentation](https://docs.solace.com/API-Developer-Online-Ref-Documentation/js/index.html)  
- [SAP Advanced Event Mesh Documentation](https://help.sap.com/docs/SAP_ADVANCED_EVENT_MESH)
