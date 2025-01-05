const sendNotification = async (receiverArn, message) => {
    try {
      const params = {
        Message: JSON.stringify({
          default: "You have a new message!",
          APNS: JSON.stringify({
            aps: {
              alert: {
                title: "New Message",
                body: message,
              },
              sound: "default",
            },
          }),
          GCM: JSON.stringify({
            notification: {
              title: "New Message",
              body: message,
              sound: "default",
            },
          }),
        }),
        MessageStructure: "json",
        TargetArn: receiverArn, // Replace with the ARN of the target device
      };
  
      const response = await sns.publish(params).promise();
      console.log("Notification sent successfully:", response);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };
  