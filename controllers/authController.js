const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config();

exports.register = async (req, res) => {
    const { username, email, password } = req.body; 
    try {
      const existingUserName = await User.findOne({ where: { username } });
      if (existingUserName) return res.status(400).json({ message: 'UserName already in use.' });

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) return res.status(400).json({ message: 'Email already in use.' });
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      await User.create({
        username,
        email,
        password: hashedPassword,
      });
  
      res.status(201).json({ message: 'User registered successfully'  });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  };

  
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


