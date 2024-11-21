const express = require('express');
const sequelize = require('./config/database'); 
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes')
require('dotenv').config();

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users',userRoutes);

sequelize
  .sync()
  .then(() => console.log('Database synced!'))
  .catch((error) => console.error('Error syncing database:', error));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
