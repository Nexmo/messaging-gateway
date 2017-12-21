var express = require('express');
var router = express.Router();
var Nexmo = require('nexmo');

var privateKey = './private.key';
var appId = process.env.APP_ID;
var apiKey = process.env.APP_ID;
var apiSecret = process.env.APP_ID;
var nexmo = new Nexmo({apiKey: apiKey, apiSecret: apiSecret, applicationId: appId, privateKey: privateKey});

const adminAcl = {
          "paths": {
            "/v1/sessions/**": {},
            "/v1/users/**": {},
            "/v1/conversations/**": {}
          }
        }

const nonAdminAcl = {
          "paths": {
            "/v1/sessions/**": {
              "methods": ["GET"]
            },
            "/v1/users/*": {
              "methods": ["GET"]
            },
            "/v1/conversations/*": {
              "methods": ["GET", "POST", "PUT"]
            }
          }
        }

router.post('/users', function(req, res, next) {
  var username = req.body.username
  var admin = req.body.admin

  nexmo.users.create({
    name: username
  }, (error, response) => {
    if (error) {
      res.json(error)
    } else {
      res.json(
        {
          user: response,
          user_jwt: Nexmo.generateJwt(privateKey, {
            application_id: appId,
            sub: username,
            exp: new Date().getTime() + 86400,
            acl: admin ? adminAcl : nonAdminAcl
          })
        }
      )
    }
  })
});

router.post('/conversations', function(req, res, next) {
  var displayName = req.body.displayName

  nexmo.conversations.create({
    display_name: displayName
  }, (error, response) => {
    if (error) {
      res.json(error)
    } else {
      res.json(response)
    }
  })
});

router.put('/conversations', function(req, res, next) {
  var conversationId = req.body.conversationId
  var userId = req.body.userId
  var action = req.body.action

  nexmo.conversations.members.add(conversationId, {
    "action": action,
    "user_id": userId,
    "channel": {
      "type": "app"
    }
  }, (error, response) => {
    if (error) {
      res.json(error)
    } else {
      res.json(response)
    }
  })
})

router.get('/users', function(req, res) {
  nexmo.users.get({}, (error, response) => {
    if (error) {
      res.json(error)
    } else {
      res.json(response)
    }
  });
});

router.get('/jwt/:user', function(req, res, next) {
  var admin = req.query.admin
  nexmo.users.get({}, (error, response) => {
    if (error) {
      res.json(error)
    } else {
      var filteredUsers = response.filter(user => user.name == req.params.user)
      if (filteredUsers.length === 0) {
        res.json({error: "User not found"})
      } else {
        res.json({
          user_jwt: Nexmo.generateJwt(privateKey, {
            application_id: appId,
            sub: req.params.user,
            exp: new Date().getTime() + 86400,
            acl: admin ? adminAcl : nonAdminAcl
          })
        });
      }
    }
  });
});




module.exports = router;