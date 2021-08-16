const db = require("../models/model");
const Op = require('sequelize').Op
const userModel = db.user
const eventModel = db.event
const groupModel = db.group
const userGroupModel = db.userGroup
const eventController = require("../controllers/event.controller.js")
const userController = require("../controllers/user.controller.js")

exports.exists = (title) => {
  return groupModel.findByPk(title).then((g) => { return g})
}

exports.isUserInGroup = (userid, title) => {
  return userGroupModel.findOne({ where: { userid, grouptitle: title }})
  .then((user) => {
    return user != null
  })
}

exports.findGroupsForUser = (userid) => {
  return userGroupModel.findAll({where: { userid: userid }, attributes: ["group_title"]})
    .then(groupids => {
      let titles = []
      groupids.forEach( (g) => {
        titles.push(g.dataValues.group_title)
      })
      if(titles.length == 0) {
        return
      }
      return groupModel.findAll({ where: { 'title': { [Op.or]: titles } }, attributes: ["title"] }).then((groups) => {
        return groups
      })
    })
}

exports.createGroup = async (title, password) => {
  return groupModel.create({ title: title, password: password })
    .then(createdGroup => {
      return createdGroup;
    })
    
}

exports.updateGroup = (group) => {
  return groupModel.findByPk(group.id)
    .then(foundGroup => {
      foundGroup.title = group.title;
      return foundGroup.save()
    })
    .catch(err => {
      console.log(err)
    })
}

exports.joinGroup = (userid, grouptitle, owner = false) => {
  return groupModel.findByPk(grouptitle)
    .then(result => {
      const usergroup = { userid: userid, grouptitle: grouptitle, owner: owner }
      console.log(usergroup)
      return userGroupModel.create(usergroup)
    })
}

exports.leaveGroup = (userid, grouptitle) => {
  return userGroupModel.findOne({ where: { userid: userid, grouptitle: grouptitle } })
  .then((userGroup) => { if (userGroup != null) { 
    return userGroup.destroy() 
  }})
}

exports.removeGroup = (userid, group) => {
  return groupModel.findByPk(group.title)
    .then(async(foundGroup) => {
      if(foundGroup.password == group.password) {
        throw "Access denied: incorrect credentials"
      }
      try {
        const result = await userGroupModel.findOne({ where: {'userid': userid, 'group_title': group.title}})
        if(result == null) {
          throw "Access denied"
        }
      } catch {
        throw "Could not verify access"
      }

      userGroupModel.findAll({ where: { groupid: foundGroup.id } })
        .then((entries) => {
          entries.forEach(el => el.destoy())
          return foundGroup.destoy()
        })
    })
}

exports.removeGroupIfEmpty = async (grouptitle) => {
  try {
    const usersInGroup = await userGroupModel.findAll({ where: { grouptitle: grouptitle }})
    if(usersInGroup == null || (usersInGroup.length && usersInGroup.length  === 0)) { 
      const group = await groupModel.findByPk(group.title)
      group.destroy();
    }
  } catch(err) {
    console.log(`Failed to check group: '${grouptitle}' for users`)
  }
}

exports.usersInGroup = (grouptitle) => {
  return userGroupModel.findAll({ where: { grouptitle }, attributes: [['user_id', 'id']]})
  .then((userids) => {
    console.log("users in group")
    if(userids.length == 0) {
      return []
    }
    return userModel.findAll({ where: { id: {[Op.or]: userids.map((user) => { return user.dataValues.id }) }}, attributes: ["id", "username"] })
  })
  .then((users)=>{
    return users
  })
}

exports.eventsForGroup = (grouptitle) => {
  return userGroupModel.findAll({ where: { 'group_title': grouptitle }, attributes: ["userid"] })
    .then(function (userResult) {
      let useridlist = []
      userResult.forEach(user => {
        useridlist.push(user.dataValues.userid)
      })
      console.log(`find events for users: ${useridlist.toString()}`)
      return eventController.findEventsForAllUsers(useridlist)
    })
    .then((events) => {
      return events
    })
}