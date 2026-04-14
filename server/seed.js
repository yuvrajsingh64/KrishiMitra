const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Service = require('./models/Service');
const connectDB = require('./config/db');

dotenv.config();

const seedData = async () => {
  await connectDB();

  try {
    // Clear existing
    await Service.deleteMany();
    // Keep users, but let's see if we have a provider
    let provider = await User.findOne({ role: 'provider' });

    if (!provider) {
      provider = await User.create({
        name: 'Seed Provider',
        email: 'provider@seed.com',
        password: 'password',
        role: 'provider'
      });
    }

    const services = [
      {
        provider: provider._id,
        title: 'Heavy Tractor Plowing',
        description: 'Professional tractor plowing service for large fields.',
        category: 'Machinery',
        price: 800,
        priceUnit: 'hr',
        iconName: 'Tractor',
        colorClass: 'text-orange-400',
        rating: 4.8,
        location: 'Navi Mumbai',
      },
      {
        provider: provider._id,
        title: 'Smart Irrigation Setup',
        description: 'Automated irrigation setup with soil moisture sensors.',
        category: 'Irrigation',
        price: 1200,
        priceUnit: 'day',
        iconName: 'Droplets',
        colorClass: 'text-blue-400',
        rating: 4.9,
        location: 'Pune Rural',
      },
      {
        provider: provider._id,
        title: 'Drone Seeding',
        description: 'Advanced drone seeding covering 10 acres per hour.',
        category: 'Advanced',
        price: 500,
        priceUnit: 'acre',
        iconName: 'Compass',
        colorClass: 'text-emerald-400',
        rating: 4.6,
        location: 'Nashik',
      }
    ];

    await Service.insertMany(services);
    console.log('Database Seeded Successfully!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
