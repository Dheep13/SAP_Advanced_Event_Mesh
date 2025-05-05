/*
 * A simple script to help set up the Solace PubSub+ demo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Solace PubSub+ Demo Setup');
console.log('=========================\n');

// Install dependencies
console.log('Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('Dependencies installed successfully.\n');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
  process.exit(1);
}

// Prompt for Solace connection details
console.log('Please enter your Solace connection details:');

rl.question('Solace Host URL (e.g., tcp://localhost:55555 or tcps://mr-connection-xyz.messaging.solace.cloud:55443): ', (solaceHost) => {
  rl.question('Message VPN Name (e.g., default): ', (messageVpn) => {
    rl.question('Username: ', (username) => {
      rl.question('Password: ', (password) => {
        rl.question('Topic Name (e.g., sample/topic): ', (topicName) => {
          // Update config.js with the provided values
          const configContent = `// Configuration for Solace connection
module.exports = {
  solaceHost: '${solaceHost}',
  messageVpn: '${messageVpn}',
  username: '${username}',
  password: '${password}',
  topicName: '${topicName || 'sample/topic'}',
  queueName: 'sample_queue'
};`;

          fs.writeFileSync('config.js', configContent);
          console.log('\nConfiguration updated successfully!');
          console.log('\nYou can now run the demo with:');
          console.log('1. npm run start-subscriber   (in one terminal)');
          console.log('2. npm run start-publisher    (in another terminal)');
          
          rl.close();
        });
      });
    });
  });
});

rl.on('close', () => {
  console.log('\nSetup complete. Happy messaging!');
  process.exit(0);
});
