require('dotenv').config();
const schedule = require('node-schedule');
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


// alarm settings
const maxAttempts = 5;
const snoozeInterval = 540000 // 9 minutes in milliseconds
const alarmNumber = '+17274589392'
const recurring = true
let currentState = 'ready'
let alarmCronJob = null;

module.exports = {
    createAlarm: function(alarmTime) {
        // Create alarm job which will run at specified time
        alarmCronJob = schedule.scheduleJob(alarmTime, function () {
            // Start call cycle 
            if (currentState != 'ready') return;
            currentState = 'on';
            executeCallCycle();
        });
    },

    // Change the alarm state to default state
    // 'ready' if the alarm is recurring
    // 'off' if the alarm is not recurring
    stopAlarm: function() {
        if(recurring) {
            currentState = 'ready';
        }
        else {
            currentState = 'off';
            // Cancels the cron job so the alarm does not trigger for the next morning
            alarmCronJob.cancel();
        }
    }
}

async function executeCallCycle(attempt = 0) {
    // If max attempts reached or alarm has been turned off, stop the alarm
    if (attempt >= maxAttempts || currentState != 'on') {
        return module.exports.stopAlarm()
    }
    // Call alarm phone number and route to /voiceResponse to detect user input
    await twilio.calls.create({
        url: process.env.SERVER_URL + '/voiceResponse',
        to: alarmNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
    })

    // Wait for 9 minutes (or whatever snoozeInterval is set at) and then execute next call cycle
    setTimeout(async () => {
        await executeCallCycle(attempt + 1)
    }, snoozeInterval);
}