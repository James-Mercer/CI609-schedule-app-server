const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')

const router = express.Router()
const db = require("../config/database.js")
//const { user, event, group, userGroup } = require("../models/model.js") //use controllers instead
const eventController = require("../controllers/event.controller.js")
const groupController = require("../controllers/group.controller.js")
const userController = require("../controllers/user.controller.js");


router.get("/", (req, res) => {
  db.authenticate()
  .then( db => {
    res.status(200).send(`API is alive - DB is alive`)
  }).catch (err => {
    res.status(202).send(`API is alive - DB is dead: "${err}"`)
  })
  
})

//this is a post we are creating a JWT
router.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  //Validate
  userController.findUserByCredentials(username)
    .then(result => {
      console.log("result")
      console.log(result)

      if (result == null || bcrypt.compareSync(password, result.password)) {
        res.status(403).send("Invalid Credentials")
        return
      }

      const token = jwt.sign({ userid: result.dataValues.id, username: result.dataValues.username }, process.env.JWT_ACCESS, { expiresIn: '1h' })
      console.log(res)
      res.status(200).send({ token });
    })
    .catch((err) => {
      res.status(500).send("Internal Server Error")
    })
})

router.post("/signup", (req, res) => {
  const username = req.body.username;
  let password = req.body.password;

  if(!username || !password) {
    res.status(403).send(`Request is missing data: "${ 
      !username ? "username" : ""}" ${
        !username || !password ? ", " : ""} ${ 
          !password ? `"password"` : ""
        }`)
    return
  }

  password = bcrypt.hashSync(password, 10)
  userController.addUser(username, password)
  .then( user => {
    const token = jwt.sign({ userid: username, username: password }, process.env.JWT_ACCESS, { expiresIn: '1h' })
    res.status(200).send({ token })
  }).catch(err => {
    console.log(err)
    res.status(500).send("Internal Server Error")
  })
})

//Event GETs and POSTs
router.get("/events", validateToken, (req, res) => {
  console.log(`Fetching events for user ${req.user.userid}`)
  const group_title = req.headers["group_title"]
  if (group_title == undefined || group_title == null) {
    eventController.findEventsById({ userid: req.user.userid })
    .then(result => {
      console.log(`returning ${result.length} events`)
      return res.json(result)
    })
    .catch(err => {
      console.log(err)
      res.sendStatus(500)
    })
  } else {
    console.log(`fetching events for group ${group_title}`)
    groupController.eventsForGroup(group_title)
    .then((events)=>{
      console.log(`returning ${events.length} events for group ${group_title}`)
      res.json(events)
    })
    .catch((err) => {
      console.log(`Error fetching events for group ${group_title}`)
      console.log(err)
      res.send(err)
    })
  }
})

router.post("/event", validateToken, (req, res) => {
  console.log(`Creating event for user ${req.user.userid}`)
  console.log(req.body)
  let { id, title, start, end, private } = req.body
  let userid = req.user.userid;
  errors = []

  if (!title) {
    errors.push("A title is required")
  }
  if (!start) {
    errors.push("A start date is required")
  }

  if (errors.length > 0) {
    return res.json({ errors, title, userid, start, end, private });
  }
  else {
    console.log("creating event")
    let newEvent = {
      id: id,
      title: title,
      userid: userid,
      start: start,
      end: end,
      private: private,
    }
    console.log(newEvent)
    eventController.createOrUpdate(newEvent)
      .then(createdEvent => {
        console.log("event created")
        res.json(createdEvent)
        return
      })
      .catch(err => {
        console.log(err)
        res.sendStatus(500)
      })
  }
})

//removeEvent
router.post("/removeEvent", validateToken, (req, res) => {
  const eventid = req.body.eventid
  eventController.removeEvent({ id: eventid })
    .then(event => {
      console.log("removed event")
      return res.sendStatus(200)
    })
    .catch(err => res.status(500).send(err))
})

// group Gets and Post
router.post("/group", validateToken, async (req, res) => {
  console.log("create group")
  console.log(req.user)
  console.log(req.body.title)
  let title = req.body.title
  let password = req.body.password ? req.body.password : null

  if (!title) {
    res.status(500).send(`Required Data not sent: ${!title ? "title" : ""}`);
  } else {
    try {
      const group = await groupController.exists(title)
      if(group != null) {
        console.log("Group Already Exists")
        res.status(409).send("Group Already Exists")
        return
      }
    } catch(err) {
      console.log(err)
      res.status(500)
      return
    }
    console.log("Group does not already exist create it")
    if(password != null) {
      password = bcrypt.hashSync(password, 10)
    }
    groupController.createGroup(title, password)
      .then(async (group) => {
        try {
          console.log("Create user group")
          const userGroup = await groupController.joinGroup(req.user.userid, group.title, true )
          if(userGroup == null) {
            throw "Error adding user to new group"
          }
        }
        catch (err) {
          console.log(err)
          res.status(202)
        }
        const users = await groupController.usersInGroup(title)
        const returnGroup = { title: group.title, users: users } 
        res.json(returnGroup)
      })
      .catch((err) => { 
        console.log(err)
        res.sendStatus(500)
      })
  }
})

router.get("/groups", validateToken, (req, res) => {
  console.log(req.user)
  const userid = req.user.userid;
  if (!userid) {
    return res.status(404).send("no user id")
  }
  console.log(`getting groups for user ${userid}`)
  groupController.findGroupsForUser(userid)
  .then( async (groups) => {
    for(group of groups) {
      try {
        const users = await groupController.usersInGroup(group.title)
        console.log(`Setting users to\n: ${JSON.stringify(users)}`)
        group.dataValues.users = users
      }
      catch(err) {
        console.log(err)
        group.users = []
      }
    }
    console.log(`Returning ${groups.length} groups`)
    res.json(groups)
  })
  .catch((err) => {
    console.log("failed")
    console.log(err)
    res.status(500).send(err)
  })
})

router.post("/joingroup", validateToken, async (req, res) => {
  const grouptitle = req.body.title
  const password = req.body.password
  if (!grouptitle) {
    return res.status(403).send("no title provided")
  }

  console.log(`User ${req.user.userid} attempting to join group ${grouptitle}`)
  
  const exists = await groupController.exists(grouptitle)
  if(exists == null) {
    console.log("Group does not exist")
    return res.status(404).send("Group does not exists")
  }
  console.log("Group found")
  console.log(exists)
  if(exists.password !== null ) {
    if(!password) {
      res.status(403).send("Password Required")
    }

    if(!bcrypt.compareSync(password, exists.password)) {
      res.status(403).send("Incorrect password")
      return
    }
  }

  try {
    if(await groupController.isUserInGroup(req.user.userid, grouptitle)) {
      res.status(403).send("Already in group")
      return
    }
  } catch (err) {
    console.log(err)
    res.status(500).send("Internal Server error")
  }

  groupController.joinGroup(req.user.userid, grouptitle)
    .then(async (result) => {
      console.log(result)
      const users = await groupController.usersInGroup(grouptitle)
      const returnGroup = { title: group.title, users: users } 
      res.json(returnGroup)
      res.json(result)
    })
    .catch(err => { 
      console.log(err)
      res.status(500).send("Failed to join group") 
    })
})

router.post("/leavegroup", validateToken, async (req, res) => {
  const grouptitle = req.body.title
  if (!grouptitle) {
    return res.status(403).send("no title provided")
  }

  console.log(`User ${req.user.userid} attempting to leave group ${grouptitle}`)

  const exists = await groupController.exists(grouptitle)
  if(exists == null) {
    console.log("Group does not exist")
    return res.status(404).send("Group does not exists")
  }
  console.log("Group found")
  console.log(exists)

  groupController.leaveGroup(req.user.userid, grouptitle)
  .then((userGroup) => {
    console.log("left group")
    console.log(userGroup)
    groupController.removeGroupIfEmpty(grouptitle)
    return res.sendStatus(200)
  })
  .catch((err) => {
    console.log(err)
    return res.sendStatus(500)
  })
})

function validateToken(req, res, next) {
  const token = req.headers["authorization"]
  if (!token) {
    console.log("No token")
    console.log(req.headers)
    return res.status(401).send("Token is invalid or expired")
  }
  jwt.verify(token, process.env.JWT_ACCESS, (err, user) => {
    if (err) {
      console.log("Invalid token: " + err)
      return res.status(403).send({ status: 403, message: err});
    }
    console.log(user)
    req.user = user;
    next();
  })
}

module.exports = router;