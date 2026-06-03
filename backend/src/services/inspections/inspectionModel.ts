import { DataTypes } from "sequelize";

import sequelize from "../../config/db";

export const INSPECTION_STATUSES = ["SCHEDULED", "COMPLETED", "OVERDUE", "CANCELLED"] as const;
export const INSPECTION_RESULTS = ["PASS", "FAIL", "NEEDS_MAINTENANCE"] as const;

const Inspection = sequelize.define(
  "Inspection",
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
    scheduledDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    scheduledTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...INSPECTION_STATUSES),
      allowNull: false,
      defaultValue: "SCHEDULED"
    },
    result: {
      type: DataTypes.ENUM(...INSPECTION_RESULTS),
      allowNull: true
    },
    findings: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recommendations: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    inspectorId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    requestedById: {
      type: DataTypes.UUID,
      allowNull: false
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "inspections",
    indexes: [
      {
        fields: ["extinguisherId"]
      },
      {
        fields: ["status"]
      },
      {
        fields: ["scheduledDate"]
      },
      {
        fields: ["inspectorId"]
      }
    ]
  }
);

export default Inspection;
