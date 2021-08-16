module.exports = (Sequelize, db) => {
  const event = db.define('Events', {
    id: {
      type: Sequelize.INTEGER,
      field: "event_id",
      primaryKey: true,
      autoIncrement: true
    },
    userid: {
      type: Sequelize.INTEGER,
      field: "user_id",
      allowNull: false
    },
    title: {
      type: Sequelize.STRING,
      field: "event_title"
    },
    start: {
      type: Sequelize.DATE,
      field: "event_start_date"
    },
    end: {
      type: Sequelize.DATE,
      field: "event_end_date"
    },
    private: {
      type: Sequelize.BOOLEAN,
      field: "event_private",
      defaultValue: false
    },
    all_day: {
      type: Sequelize.BOOLEAN,
      field: "event_all_day",
      defaultValue: false
    },
  }, {
    freezeTableName: true,
    timestamps: false
  })
  return event
}