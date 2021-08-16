const Sequelize = require("sequelize");
const db = require("../config/database.js");

//Tables
const user = require("./user.model.js")(Sequelize, db);
const event = require("./event.model.js")(Sequelize, db);
const group = require("./group.model.js")(Sequelize, db);
const userGroup = require("./usergroup.model.js")(Sequelize, db);

//Relations
//user.belongsToMany(group, { through: userGroup })
//group.belongsToMany(user, { through: userGroup })

module.exports = {
  db: db,
  user: user,
  event: event,
  group: group,
  userGroup: userGroup
}