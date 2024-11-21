const { Op } = require("sequelize");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csv = require("csv-parser");
const Product = require('../models/productModel'); 
const sequelize = require('../config/database');

const upload = multer({
  dest: 'uploads/', 
});


exports.uploadCsvFile = [
  upload.single('file'), 
  async (req, res) => {
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = path.join(__dirname, '../', req.file.path);
    const products = [];
    const requiredHeaders = [
      'Campaign Name', 'Ad Group ID', 'FSN ID',
      'Product Name', 'Ad Spend', 'Views', 'Clicks',
      'Direct Revenue', 'Indirect Revenue', 'Direct Units', 'Indirect Units'
    ];

    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('headers', (headers) => {
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
              return reject(new Error(`Missing headers: ${missingHeaders.join(', ')}`));
            }
          })
          .on('data', (row) => {
            const mappedRow = {
              campaignName: row['Campaign Name'],
              adGroupId: row['Ad Group ID'],
              fsnId: row['FSN ID'],
              productName: row['Product Name'],
              adSpend: parseFloat(row['Ad Spend']),
              views: parseInt(row['Views'], 10),
              clicks: parseInt(row['Clicks'], 10),
              directRevenue: parseFloat(row['Direct Revenue']),
              indirectRevenue: parseFloat(row['Indirect Revenue']),
              directUnits: parseInt(row['Direct Units'], 10),
              indirectUnits: parseInt(row['Indirect Units'], 10),
            };

            if (isNaN(mappedRow.adSpend) || isNaN(mappedRow.directRevenue) || isNaN(mappedRow.indirectRevenue)) {
              return reject(new Error('Invalid numeric values found in the CSV'));
            }

            products.push(mappedRow); 
          })
          .on('end', resolve)
          .on('error', reject);
      });

      const transaction = await sequelize.transaction();

      try {
        await Product.bulkCreate(products, {
          updateOnDuplicate: [
            'campaignName', 'adGroupId', 'productName', 'adSpend',
            'views', 'clicks', 'directRevenue', 'indirectRevenue',
            'directUnits', 'indirectUnits',
          ],
          transaction,
        });

        await transaction.commit(); 
        res.status(200).json({
          message: 'File processed successfully',
          recordsInserted: products.length,
        });
      } catch (error) {
        await transaction.rollback(); 
        throw error;
      }
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ message: 'Error processing file', error: error.message });
    } finally {
      fs.promises.unlink(filePath).catch(err => console.error('Error deleting file:', err));
    }
  }
];

const calculateStats = (data) => {
  return data.map((item) => {
    const adSpend = parseFloat(item["Ad Spend"] || 0);
    const views = parseInt(item.Views || 0);
    const clicks = parseInt(item.Clicks || 0);
    const directRevenue = parseFloat(item["Direct Revenue"] || 0);
    const indirectRevenue = parseFloat(item["Indirect Revenue"] || 0);
    const directUnits = parseInt(item["Direct Units"] || 0);
    const indirectUnits = parseInt(item["Indirect Units"] || 0);

    const totalRevenue = directRevenue + indirectRevenue;
    const totalOrders = directUnits + indirectUnits;
    const ctr = views > 0 ? (clicks / views) * 100 : 0;
    const roas = adSpend > 0 ? totalRevenue / adSpend : 0;

    return {
      campaign: item["Campaign Name"],
      adGroupID: item["Ad Group ID"],
      fsnID: item["FSN ID"],
      productName: item["Product Name"],
      adSpend,
      views,
      clicks,
      ctr: ctr.toFixed(2),
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
      roas: roas.toFixed(2),
    };
  });
};

const filterCSV = async (filters) => {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream('./data/systemTest.csv')
      .pipe(csv())
      .on("data", (row) => {
        let matchesFilter = true;
        Object.keys(filters).forEach((key) => {
          if (filters[key] && row[key] !== filters[key]) {
            matchesFilter = false;
          }
        });

        if (matchesFilter) results.push(row);
      })
      .on("end", () => {
        const calculatedResults = calculateStats(results);
        resolve(calculatedResults);
      })
      .on("error", (err) => reject(err));
  });
};

exports.reportByCampaign = async (req, res) => {
  const {  campaignName,  adGroupID,  fsnID,  productName } = req.body;

  const filters = {};
    if(campaignName)filters["Campaign Name"] = campaignName;
  try {
    const data = await filterCSV(filters);
    res.status(200).json({ campaign: data });
  } catch (error) {
    res.status(500).json({ message: "Error processing campaign report", error: error.message });
  }
};

exports.reportByAdGroup = async (req, res) => {
  const {  campaignName,  adGroupId,  fsnId,  productName } = req.body;
if(!adGroupId){
  return res.status(400).json({message: "Ad Group ID is required"})
}
  const filters = {
  "Ad Group ID" : adGroupId
  };
  try {
    const data = await filterCSV(filters);
    if(data.length ===0){
      res.status(404).json({message: "No data found for the given filters"})
    }
    res.status(200).json({ adGroupID: data });
  } catch (error) {
    res.status(500).json({ message: "Error processing Ad Group ID report", error: error.message });
  }
};

exports.reportByFSN = async (req, res) => {
  const {  fsnId, campaignName,  adGroupId,  productName } = req.body;
  if(!fsnId){
    return res.status(400).json({message: "FSN ID is required"})
  }
  const filters = {
    "FSN ID": fsnId
  };

  try {
    const data = await filterCSV(filters);
    if(data.length ===0){
      res.status(404).json({message: "No data found for the given filters"})
    }
    res.status(200).json({ fsnID: data });
  } catch (error) {
    res.status(500).json({ message: "Error processing FSN ID report", error: error.message });
  }
};

exports.reportByProduct = async (req, res) => {
  const { productName,  campaignName,  adGroupId,  fsnId } = req.body;
  if(!productName){
    return res.status(400).json({message: "Product Name is required"})
  }
  const filters = {
    "Product Name": productName
  };

  try {
    const data = await filterCSV(filters);
    if(data.length ===0){
      res.status(404).json({message: "No data found for the given filters"})
    }
    res.status(200).json({ productName: data });
  } catch (error) {
    res.status(500).json({ message: "Error processing product report", error: error.message });
  }
}
