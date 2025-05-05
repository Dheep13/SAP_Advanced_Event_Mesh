# Solace PubSub+ Setup Guide

This document provides a step-by-step guide for setting up Solace PubSub+ for our event-driven messaging system.

## Table of Contents
1. [Creating a Solace Cloud Account](#creating-a-solace-cloud-account)
2. [Setting Up a Solace Service](#setting-up-a-solace-service)
3. [Creating a Message VPN](#creating-a-message-vpn)
4. [Setting Up Client Authentication](#setting-up-client-authentication)
5. [Configuring Topics and Queues](#configuring-topics-and-queues)
6. [Connecting Your Application](#connecting-your-application)
7. [Monitoring and Management](#monitoring-and-management)
8. [Troubleshooting](#troubleshooting)

## Creating a Solace Cloud Account

1. **Sign up for Solace Cloud**:
   - Visit [Solace Cloud](https://console.solace.cloud/login/new-account)
   - Click "Sign Up" and create an account
   - Verify your email address

2. **Choose a Plan**:
   - We selected the free tier which includes:
     - 1 messaging service
     - Up to 50 connections
     - 10 GB of message storage
     - 250 messages per second

## Setting Up a Solace Service

1. **Create a New Service**:
   - From the Solace Cloud Console, click "Create Service"
   - Select "PubSub+ Software" as the service type
   - Choose the "Free" plan

2. **Configure Service Details**:
   - Service Name: `ecommerce-event-broker`
   - Cloud Provider: AWS (default)
   - Region: US East (default)
   - Click "Create"

3. **Service Provisioning**:
   - Wait for the service to be provisioned (typically takes 2-3 minutes)
   - Once complete, you'll see "Running" status

## Creating a Message VPN

In our setup, we used the default Message VPN named "test" that comes pre-configured with the free tier. If you need to create additional VPNs (available in paid plans):

1. **Access VPN Settings**:
   - From your service dashboard, go to "Message VPN" section
   - Click "Create Message VPN"

2. **Configure VPN**:
   - VPN Name: `test` (we used the default)
   - Authentication: Basic (username/password)
   - Enable Guaranteed Messaging: Yes
   - Max Connections: 50 (free tier limit)
   - Click "Create"

## Setting Up Client Authentication

1. **Create Client Username**:
   - From your service dashboard, go to "Access Control" → "Client Usernames"
   - Click "Create Client Username"
   - Username: `solace-cloud-client`
   - Password: `Ultimate13!`
   - Click "Create"

2. **Set Permissions**:
   - From the client username details page, go to "Permissions"
   - Grant the following permissions:
     - Connect: Yes
     - Publish: Yes
     - Subscribe: Yes
     - Guaranteed Endpoint Create: Yes
     - Guaranteed Messaging Send: Yes
     - Guaranteed Messaging Receive: Yes

## Configuring Topics and Queues

For our event-driven architecture, we set up a hierarchical topic structure:

1. **Topic Structure**:
   - We didn't need to explicitly create topics in Solace as they are created dynamically
   - Our topic hierarchy follows this pattern:
     ```
     ecommerce/orders/*
     ecommerce/inventory/*
     ecommerce/customers/*
     ecommerce/payments/*
     ```

2. **Queue Setup** (optional - not used in our basic demo):
   - From your service dashboard, go to "Queues"
   - Click "Create Queue"
   - Queue Name: `sample_queue`
   - Access Type: Exclusive
   - Click "Create"

3. **Topic to Queue Mapping** (optional - not used in our basic demo):
   - From the queue details page, go to "Subscriptions"
   - Click "Add Subscription"
   - Topic: `ecommerce/>`
   - Click "Create"

## Connecting Your Application

1. **Get Connection Details**:
   - From your service dashboard, click "Connect"
   - Select "Solace Messaging" as the API
   - Select "Node.js" as the language
   - Note the following details:
     - Secured Web Messaging URL: `wss://mr-connection-v5fuflj987h.messaging.solace.cloud:443`
     - Message VPN: `test`
     - Client Username: `solace-cloud-client`
     - Password: `Ultimate13!`

2. **Update Configuration**:
   - In our application, we updated the `config.js` file with these connection details:
     ```javascript
     module.exports = {
       solaceHost: 'wss://mr-connection-v5fuflj987h.messaging.solace.cloud:443',
       messageVpn: 'test',
       username: 'solace-cloud-client',
       password: 'Ultimate13!',
       // ... other configuration
     };
     ```

3. **Install Solace JavaScript API**:
   - We installed the Solace JavaScript API using npm:
     ```
     npm install solclientjs
     ```

## Monitoring and Management

1. **Monitor Connections**:
   - From your service dashboard, go to "Connections"
   - View all active client connections
   - Monitor connection status and statistics

2. **Monitor Message Traffic**:
   - From your service dashboard, go to "Metrics"
   - View real-time metrics for:
     - Message rate
     - Connection count
     - Bandwidth usage
     - Queue depth

3. **View Event Logs**:
   - From your service dashboard, go to "Event Logs"
   - Monitor system events and errors

## Troubleshooting

During our setup, we encountered and resolved the following issues:

1. **DNS Resolution Error**:
   - **Issue**: The hostname `mr-connection-v5fufj987h.messaging.solace.cloud` couldn't be resolved
   - **Solution**: Double-checked the hostname in the Solace console and corrected a typo in our config file

2. **Authentication Error**:
   - **Issue**: Received "401 Unauthorized" errors when trying to connect
   - **Solution**: Updated the password in our config file to match the one set in the Solace console

3. **API Compatibility Issue**:
   - **Issue**: Some methods like `setType()` weren't available in the Solace JavaScript API
   - **Solution**: Used `setUserPropertyMap()` with an `SDTMapContainer` to set message properties instead

## Additional Resources

- [Solace PubSub+ Documentation](https://docs.solace.com/)
- [Solace JavaScript API Reference](https://docs.solace.com/API-Developer-Online-Ref-Documentation/js/index.html)
- [Solace Cloud Console](https://console.solace.cloud/)
- [Solace Community](https://solace.community/)

---

By following this setup guide, you should be able to recreate our Solace PubSub+ environment for event-driven messaging. The configuration provides a solid foundation for building scalable, event-driven applications.
