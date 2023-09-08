const express = require('express');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const schedule = require('node-schedule');

const app = express();
app.use(express.urlencoded({
    extended: true
}));

const {createAlarm, stopAlarm} = require('./services/alarm');

// Executed when phone call is answered
app.post('/voiceResponse', async (req, res) => {
    const twiml = new VoiceResponse();
    const gather = twiml.gather({
        action: '/stopAlarm',
        input: 'dtmf',
        numDigits: 1
    })
    gather.say('Good morning! Press any number to stop the alarm.');

    res.type('text/xml');
    res.send(twiml.toString());
})

// Executed when a digit has been entered during an ongoing call
app.post('/stopAlarm', async (req, res) => {
    if(req.body?.Digits) {
        // Stop the alarm
        stopAlarm();

        // Hang up call
        const twiml = new VoiceResponse();
        twiml.say("Alarm Stopped. Goodbye.");
        twiml.hangup();
        res.type('text/xml');
        res.send(twiml.toString());
    }
})

app.listen(3000, () => {
    console.log(`Listening on port 3000`);
});

const alarmTime = new schedule.RecurrenceRule();
alarmTime.hour = 8;
alarmTime.minute = 30;
alarmTime.tz = 'Etc/UTC';

createAlarm(alarmTime);