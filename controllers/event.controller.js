const db = require("../models/model.js")
const Op = require('sequelize').Op
const eventModel = db.event;


exports.findEventsById = (user) => {
  return eventModel.findAll({ where: { userid: user.userid } })
}

exports.findEventsForAllUsers = (userids) => {
  return eventModel.findAll({ where: { userid: { [Op.or]: userids } }})
}

exports.createEvent = (event) => {
  console.log("create event")
  return eventModel.create(event)
}

exports.updateEvent = (event) => {
  console.log("updating event")
  return eventModel.update(event, { where: { id: event.id }})
}

exports.createOrUpdate = async function (event) {
  console.log("create event or update event")
  if(event.id) {
    let existing = await eventModel.findByPk(event.id)
    if(existing) {
      return await this.updateEvent(event)
    }
  }
  return await this.createEvent(event)
}

exports.removeEvent = (event) => {
  return eventModel.destroy({ where: { id: event.id } })
}