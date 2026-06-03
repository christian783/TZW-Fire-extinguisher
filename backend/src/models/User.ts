import bcrypt from "bcryptjs";
import { DataTypes } from "sequelize";

import sequelize from "../config/db";

const BCRYPT_COST_FACTOR = 10;
export const USER_ROLES = ["ADMIN", "INSPECTOR", "USER"] as const;

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      },
      set(value) {
        this.setDataValue("email", String(value).toLowerCase().trim());
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM(...USER_ROLES),
      allowNull: false,
      defaultValue: "USER"
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    otpCodeHash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    otpExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    otpVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "users",
    defaultScope: {
      attributes: { exclude: ["password", "otpCodeHash"] }
    },
    scopes: {
      withPassword: {
        attributes: { include: ["password", "otpCodeHash"] }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ["email"]
      }
    ]
  }
);

User.beforeCreate(async (user: any) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, BCRYPT_COST_FACTOR);
  }
});

User.beforeUpdate(async (user: any) => {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, BCRYPT_COST_FACTOR);
  }
});

(User as any).prototype.comparePassword = function comparePassword(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

(User as any).prototype.toJSON = function toJSON() {
  const values = { ...this.get() };
  delete values.password;
  delete values.otpCodeHash;
  return values;
};

export default User;
