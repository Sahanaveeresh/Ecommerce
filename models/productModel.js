const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true, 
  },
  fsnId: { type: DataTypes.STRING },
  campaignName: { type: DataTypes.STRING },
  adGroupId: { type: DataTypes.STRING },
  productName: { type: DataTypes.STRING },
  adSpend: { type: DataTypes.FLOAT },
  views: { type: DataTypes.INTEGER },
  clicks: { type: DataTypes.INTEGER },
  directRevenue: { type: DataTypes.FLOAT },
  indirectRevenue: { type: DataTypes.FLOAT },
  directUnits: { type: DataTypes.INTEGER },
  indirectUnits: { type: DataTypes.INTEGER },
}, {
  timestamps: true,
});

module.exports = Product;
