const db = require("../models/model");

const userModel = db.user;

exports.findUserById = async function (user) {
  return userModel.findByPK(user.id)
    .then(user => {
      return user
    })
    .catch(err => {
      console.log(err)
      return null
    })
}

exports.findUsersById = (userids) => {
  return userModel.findAll({ where: { id: { [Op.or]: userids }}})
}

exports.findUserByCredentials =  (username) => {
  return userModel.findOne({ where: { username: username} })
    .then(user => { return user })
    .catch(err => {
      console.log(err)
      return null
    })
}

exports.addUser = async function (username, password) {
  return userModel.create({username, password})
    .then((createdUser) => {
      return createdUser
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.removeUser = async function (user) {
  return userModel.findByPK(user.id)
    .then(foundUser => {
      return foundUser.destoy()
    })
    .catch(err => {
      console.log(err)
    })
}