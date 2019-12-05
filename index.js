var config = require('./config.json');
var Twilio = require('twilio');
var _ = require('lodash');
var people = require('./people.json').people;

var twilio = new Twilio(config.twilioKey, config.twilioSecret);

function getSantas() {
  var recipients = _.shuffle(people);
  var santas = recipients.slice(0);

  for (var i = 0; i < santas.length; i++) {
    var santa = santas[i];
    var filtered = _.reject(recipients, function (r) {
      const avoids = _.concat(santa.avoids, santa.name);
      return _.includes(avoids, r.name);
    });
    var recipient = _.shuffle(filtered)[0];
    // This happens if someone is left with only themselves to match...
    if (recipient === undefined) { return getSantas(); }
    santa.recipient = recipient.name;
    recipients = _.reject(recipients, recipient);
  };

  return santas;
}

function sendSantaMessage(santa) {
  twilio.messages.create({
    to: santa.number,
    from: config.twilioNumber,
    // body: 'Testing again... respond to this if you get it.',
    body: `Hey. Get a 20 to 25 dollar gift for ${santa.recipient}. (2019D)`,
  }, function(err, res) {
    if (err) {
      return console.warn('Error received from Twilio', err);
    }

    console.log('Twilio message sent successfully', res.sid);
  });
}

var santas = getSantas();
var noDuplicates = santas.length === _.uniq(_.map(santas, 'recipient')).length;

if(noDuplicates) {
  console.log('Success!');
  console.log(_.map(santas, 'recipient'));
  santas.forEach(function (santa) {
    sendSantaMessage(santa);
  });
} else {
  console.log('FOUND DUPLICATE RECIPIENTS, TRY AGAIN');
  console.log(_.map(santas, 'recipient'));
}
