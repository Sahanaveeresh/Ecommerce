const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.post('/csv/upload-csv', productController.uploadCsvFile);
router.post("/report/campaign", productController.reportByCampaign);
router.post("/report/adGroupID", productController.reportByAdGroup);
router.post("/report/fsnID", productController.reportByFSN);
router.post("/report/productName", productController.reportByProduct);

module.exports = router;
