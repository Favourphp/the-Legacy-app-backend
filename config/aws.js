const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: "us-east-1", // Replace with your region
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Set via environment variables
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Set via environment variables
});

const sns = new AWS.SNS();
