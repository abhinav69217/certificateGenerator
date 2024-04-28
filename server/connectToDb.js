const mongoose = require('mongoose');

async function connectToDb(mongoURI) {
    try {
        mongoose.connect(mongoURI).then(()=>{
            console.log("DB connected successfully");
        })
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

module.exports = connectToDb;
