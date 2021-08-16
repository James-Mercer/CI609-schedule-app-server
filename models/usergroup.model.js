module.exports = (Sequelize, db) => {
  const userGroup = db.define("user_groups", {
    userid: {
      type: Sequelize.INTEGER,
      field: "user_id",
      primaryKey: true,
      allowNull: false
    },
    grouptitle: {
      type: Sequelize.INTEGER,
      field: "group_title",
      primaryKey: true,
      allowNull: false
    },
    owner: {
      type: Sequelize.BOOLEAN,
      field: "owner"
    }
  }, {
    freezeTableName: true,
    timestamps: false
  })
  return userGroup;
}