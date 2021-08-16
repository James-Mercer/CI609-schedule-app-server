module.exports = (Sequelize, db) => {
  const user = db.define('Users', {
    id: {
      type: Sequelize.INTEGER,
      field: "user_id",
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    username: {
      type: Sequelize.STRING,
      field: "username"
    },
    password: {
      type: Sequelize.STRING,
      field: "password",
    },
  }, {
    freezeTableName: true,
    timestamps: false,
  })
  return user;
}