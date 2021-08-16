module.exports = (Sequelize, db) => {
  const group = db.define('Groups', {
    title: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
      field: "group_title"
    },
    password: {
      type: Sequelize.STRING,
      field: "group_password"
    }
  }, {
    freezeTableName: true,
    timestamps: false
  })
  return group;
}

