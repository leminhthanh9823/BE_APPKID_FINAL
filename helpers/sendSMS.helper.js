const twilio = require('twilio');
const crypto = require('crypto');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
async function sendSms(to, message) {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to 
    });
    console.log(`SMS sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

function generateSecureOTP() {
  const randomNumber = crypto.randomInt(0, 1000000);

  const otp = randomNumber.toString();
  return otp.padStart(6, '0');
}


module.exports = {
  sendSms,
  generateSecureOTP
};
