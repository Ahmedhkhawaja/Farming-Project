// fixStockCategoriesMigration.js
const mongoose = require("mongoose");
const User = require("./models/User");
const Stock = require("./models/Stock");
const ProductType = require("./models/ProductType");
const ProductCategory = require("./models/ProductCategory");
const ProductSubCategory = require("./models/ProductSubCategory");
const Product = require("./models/Product");
require("dotenv").config();


// Migration mapping - old names to new names
const migrationMap = {
  'Union Square, Manhattan': (date) => {
    const day = new Date(date).getDay();
    // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    if (day === 1) return 'Union Square (Monday) Manhattan';
    if (day === 3) return 'Union Square (Wednesday) Manhattan';
    if (day === 6) return 'Union Square (Saturday) Manhattan';
    return 'Union Square (Monday) Manhattan'; // default
  },
  'Columbia University, West Manhattan': 'Columbia University (Thursday) Upper west side Manhattan',
  'Tribecca, Lower Manhattan': 'Tribecca (Saturday) Lower Manhattan',
  'Larchmont Westchester, NY': 'Larchmont (Saturday) Westchester NY',
  'Carroll Gardens, Brooklyn': 'Carrol Gardens (Sunday) Brooklyn',
  'Jackson Heights, Queens': 'Jackson Heights (Sunday) Queens'
};

async function migrateLocations() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/grocery-sales",
    );

    console.log("Connected to MongoDB");

  // Get the stocks collection (adjust based on your actual collection name)
    const db = mongoose.connection.db;
    const stocksCollection = db.collection('stocks'); // or your collection name

    // Get all documents
    const cursor = stocksCollection.find({});
    let updatedCount = 0;
    let skippedCount = 0;

    console.log('Starting migration...');

    // Process each document
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const oldLocation = doc.location;
      
      // Check if this location needs migration
      if (migrationMap[oldLocation]) {
        let newLocation;
        
        // Check if it's a function (for Union Square) or direct mapping
        if (typeof migrationMap[oldLocation] === 'function') {
          newLocation = migrationMap[oldLocation](doc.date || doc.createdAt || new Date());
        } else {
          newLocation = migrationMap[oldLocation];
        }

        // Update the document
        await stocksCollection.updateOne(
          { _id: doc._id },
          { $set: { location: newLocation } }
        );

        console.log(`✓ Updated: ${oldLocation} -> ${newLocation}`);
        updatedCount++;
      } else {
        // Location doesn't need migration (already using new format or not in mapping)
        skippedCount++;
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Updated: ${updatedCount} documents`);
    console.log(`Skipped: ${skippedCount} documents`);
    console.log('========================\n');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateLocations();