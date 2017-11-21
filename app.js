var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var twilio = require('twilio');

var oConnections = {};

// Define the port to run on
app.set('port', process.env.PORT || parseInt(process.argv.pop()) || 5100);

// Define the Document Root path
var sPath = path.join(__dirname, '.');

app.use(express.static(sPath));
app.use(bodyParser.urlencoded({ extended: true }));

//for web
function fPlay(req, res){
  var sFrom = req.body.From;
  var sAction = req.body.Body;
  var twiml = new twilio.twiml.MessagingResponse();
  if(sAction.toLowerCase().search("login") != -1){
    twiml.message("I would love to help you with that. Could you please foward me your email you have with us.");
  }else if(sAction.toLowerCase().search("network") != -1){
    twiml.message("Are you having trouble loading the page? Yes/No ");
    oConnections[sFrom].fCurState = fStickOrHydrant;
  }else{
    twiml.message("Sorry I can't seem to help you with " + sAction + " Please feel free to give our Customer Service a call.")
    oConnections[sFrom].fCurState = fBeginning;
  }
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
}
//for phone
function fStick(req, res){
  var sFrom = req.body.From;
  var sAction = req.body.Body;
  var twiml = new twilio.twiml.MessagingResponse();
  if(sAction.toLowerCase().search("yes") != -1){
    oConnections[sFrom].fCurState = fStickOrHydrant;
    twiml.message("I would love to help you with that. Could you please foward me your email you have with us.");
  }else if(sAction.toLowerCase().search("no") != -1){
    twiml.message("Are you having a technical problem? Yes/No");
    oConnections[sFrom].fCurState = fPlay;
  }else{
    twiml.message("Sorry I can't seem to help you with " + sAction + " Please feel free to give our Customer Service a call.")
    oConnections[sFrom].fCurState = fBeginning;
  }
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
}
//Functions for stick or hydrant - my code will be for Phone or Web
function fStickOrHydrant(req, res){
  var sFrom = req.body.From;
  var sAction = req.body.Body;
  var twiml = new twilio.twiml.MessagingResponse();
  if(sAction.toLowerCase().search("phone") != -1){
    twiml.message("Are you having trouble logging in? Yes/No ");
    oConnections[sFrom].fCurState = fStick;
  }else if(sAction.toLowerCase().search("web") != -1){
    twiml.message("Are you having a login problem or a network problem?");
  }else {
    twiml.message("Sorry I can't seem to help you with " + sAction + " Please feel free to give our Customer Service a call.")
  }
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
}

function fBeginning(req, res){
  var sFrom = req.body.From;
  oConnections[sFrom].fCurState = fStickOrHydrant;
  var twiml = new twilio.twiml.MessagingResponse();
  twiml.message('Hi there, this is Sandra from Tech Support. How can I help you? Are you looking for Phone or Web Support?');
  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());

}

//define a method for the twilio webhook
app.post('/sms', function(req, res) {
  var sFrom = req.body.From;
  if(!oConnections.hasOwnProperty(sFrom)){
    oConnections[sFrom] = {"fCurState":fBeginning};
  }
  oConnections[sFrom].fCurState(req, res);
});

// Listen for requests
var server = app.listen(app.get('port'), () =>{
  var port = server.address().port;
  console.log('Listening on localhost:' + port);
  console.log("Document Root is " + sPath);
});
