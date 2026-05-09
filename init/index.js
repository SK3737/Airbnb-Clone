require('dotenv').config();
const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing.js');

const dbURL = process.env.ATLAS_URL || 'mongodb://127.0.0.1:27017/wanderlust';

main()
    .then(() => {
        console.log("connected to database");
    })
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect(dbURL);
}

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({...obj, owner: "6989979856ce0edf12f38bff"}))
    await Listing.insertMany(initData.data);
    console.log("Database initialized with sample data");
}

initDB();