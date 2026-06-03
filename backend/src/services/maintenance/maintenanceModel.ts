import { DataTypes } from "sequelize";

import sequelize from "../../config/db";

const MaintenanceLog = sequelize.define(
  "MaintenanceLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    extinguisherId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    inspectorId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    actionTaken: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    maintenanceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    issuesIdentified: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recommendations: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: "maintenance_logs",
    indexes: [
      {
        fields: ["extinguisherId"]
      },
      {
        fields: ["inspectorId"]
      },
      {
        fields: ["maintenanceDate"]
      }
    ]
  }
);

export default MaintenanceLog;
