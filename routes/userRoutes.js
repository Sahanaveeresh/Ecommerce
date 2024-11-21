const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate'); 

router.post('/', authenticate, userController.createUser)

router.get('/get/:id', authenticate, userController.getUserById);

router.put('/update/:id', authenticate, userController.updateUser);

router.delete('/delete/:id', authenticate, userController.deleteUser);

module.exports = router;
