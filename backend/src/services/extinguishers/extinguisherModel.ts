import { DataTypes } from "sequelize";

import sequelize from "../../config/db";

export const EXTINGUISHER_TYPES = ["WATER", "CO2", "FOAM", "DRY_CHEMICAL"] as const;
export const EXTINGUISHER_SIZES = ["2.5 lb", "5 lb", "9 lb", "12 lb"] as const;
export const EXTINGUISHER_STATUSES = ["ACTIVE", "DUE_FOR_INSPECTION", "MAINTENANCE_REQUIRED", "EXPIRED", "RETIRED"] as const;

const FireExtinguisher = sequelize.define(
  "FireExtinguisher",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    serialNumber: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 80]
      }
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    type: {
      type: DataTypes.ENUM(...EXTINGUISHER_TYPES),
      allowNull: false
    },
    size: {
      type: DataTypes.ENUM(...EXTINGUISHER_SIZES),
      allowNull: false
    },
    installationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...EXTINGUISHER_STATUSES),
      allowNull: false,
      defaultValue: "ACTIVE"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: "fire_extinguishers",
    indexes: [
      {
        unique: true,
        fields: ["serialNumber"]
      },
      {
        fields: ["status"]
      },
      {
        fields: ["type"]
      },
      {
        fields: ["expiryDate"]
      }
    ]
  }
);

export default FireExtinguisher;
