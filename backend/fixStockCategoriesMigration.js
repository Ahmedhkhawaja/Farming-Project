// fixStockCategoriesMigration.js
const mongoose = require("mongoose");
const User = require("./models/User");
const Stock = require("./models/Stock");
const ProductType = require("./models/ProductType");
const ProductCategory = require("./models/ProductCategory");
const ProductSubCategory = require("./models/ProductSubCategory");
const Product = require("./models/Product");
require("dotenv").config();

async function completeDataCleanup() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/grocery-sales",
    );

    console.log("Connected to MongoDB");

   // Get all valid categories from database
    const categories = await ProductCategory.find().populate('productType', 'name');
    
    // Create lookup maps
    const typeToCategories = {};
    const categoryToType = {};
    const validCategories = [];
    
    categories.forEach(cat => {
      const typeName = cat.productType.name;
      const categoryName = cat.name;
      
      if (!typeToCategories[typeName]) {
        typeToCategories[typeName] = [];
      }
      typeToCategories[typeName].push(categoryName);
      categoryToType[categoryName] = typeName;
      validCategories.push(categoryName);
    });

    console.log('Valid categories by type:', typeToCategories);

    // Define standard units
    const standardUnits = {
      'Greens': {
        'Lettuce': 'bunch',
        'Baby Green': 'bag',
        'Arugula': 'bunch',
        'Frisee': 'bunch',
        'Broccoli Raab': 'bunch',
        'Spinach': 'bunch',
        'Bokchoy': 'bunch',
        'Bunches': 'bunch',
        'Mixed Greens': 'bag'
      },
      'Kitchen': {
        'Soup': 'bowl',
        'Juice': 'bottle',
        'Small Kimchi': 'jar',
        'Large Kimchi': 'jar',
        'Dumpling': 'pack',
        'Chips': 'bag',
        'Moo Radish': 'piece',
        'Cheese Pumpkin': 'piece',
        'Burger': 'piece',
        'General Kitchen': 'piece'
      }
    };

    // Get all stocks
    const stocks = await Stock.find();
    console.log(`Found ${stocks.length} stocks to clean up`);

    const corrections = {
      invalidCategory: 0,
      mismatchedType: 0,
      wrongUnit: 0,
      missingData: 0
    };

    // Clean up each stock
    for (const stock of stocks) {
      let needsSave = false;
      
      // 1. Check if category is valid
      if (!validCategories.includes(stock.productCategory)) {
        console.log(`❌ Invalid category: ${stock.productCategory}`);
        // Find correct category based on type
        if (stock.productType && typeToCategories[stock.productType]) {
          stock.productCategory = typeToCategories[stock.productType][0];
          needsSave = true;
          corrections.invalidCategory++;
          console.log(`   → Fixed to: ${stock.productCategory}`);
        }
      }
      
      // 2. Check if type matches category
      if (stock.productCategory && categoryToType[stock.productCategory]) {
        const expectedType = categoryToType[stock.productCategory];
        if (stock.productType !== expectedType) {
          console.log(`⚠ Type mismatch: ${stock.productType} → ${expectedType} for ${stock.productCategory}`);
          stock.productType = expectedType;
          needsSave = true;
          corrections.mismatchedType++;
        }
      }
      
      // 3. Fix units
      if (stock.productType && stock.productCategory) {
        const expectedUnit = standardUnits[stock.productType]?.[stock.productCategory];
        if (expectedUnit && stock.unit !== expectedUnit) {
          // Special case: Kitchen items should not be "Cases"
          if (stock.productType === 'Kitchen' && stock.unit === 'Cases') {
            console.log(`⚠ Wrong unit for Kitchen: ${stock.unit} → ${expectedUnit}`);
            stock.unit = expectedUnit;
            needsSave = true;
            corrections.wrongUnit++;
          }
          // For Greens, Cases might be acceptable as bulk measurement
          else if (stock.productType === 'Greens' && stock.unit === 'Cases') {
            // Keep Cases if it's intentional bulk measurement
            console.log(`ℹ Greens in Cases: ${stock.productCategory} - keeping bulk unit`);
          }
          else if (expectedUnit && stock.unit !== expectedUnit) {
            console.log(`⚠ Wrong unit: ${stock.unit} → ${expectedUnit}`);
            stock.unit = expectedUnit;
            needsSave = true;
            corrections.wrongUnit++;
          }
        }
      }
      
      // 4. Check for missing data
      if (!stock.productType || !stock.productCategory || !stock.unit) {
        console.log(`⚠ Missing data in stock ${stock._id}:`);
        if (!stock.productType) {
          console.log('   Missing productType');
          stock.productType = 'Greens';
          needsSave = true;
          corrections.missingData++;
        }
        if (!stock.productCategory) {
          console.log('   Missing productCategory');
          stock.productCategory = stock.productType === 'Kitchen' ? 'General Kitchen' : 'Mixed Greens';
          needsSave = true;
          corrections.missingData++;
        }
        if (!stock.unit) {
          console.log('   Missing unit');
          stock.unit = stock.productType === 'Kitchen' ? 'piece' : 'bunch';
          needsSave = true;
          corrections.missingData++;
        }
      }

      if (needsSave) {
        await stock.save();
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('CLEANUP COMPLETE');
    console.log('='.repeat(50));
    console.log('Corrections made:');
    console.log(`  Invalid categories fixed: ${corrections.invalidCategory}`);
    console.log(`  Type mismatches corrected: ${corrections.mismatchedType}`);
    console.log(`  Wrong units fixed: ${corrections.wrongUnit}`);
    console.log(`  Missing data filled: ${corrections.missingData}`);

    // Final verification
    console.log('\nFINAL DATA QUALITY CHECK:');
    
    const kitchenWithCases = await Stock.countDocuments({
      productType: 'Kitchen',
      unit: 'Cases'
    });
    
    console.log(`Kitchen items with "Cases" unit: ${kitchenWithCases} (should be 0)`);
    
    if (kitchenWithCases > 0) {
      console.log('\n⚠ WARNING: Some Kitchen items still have "Cases" unit');
      const problematic = await Stock.find({
        productType: 'Kitchen',
        unit: 'Cases'
      }).select('productCategory unit');
      
      problematic.forEach(item => {
        console.log(`  - ${item.productCategory}: ${item.unit}`);
      });
    } else {
      console.log('✓ All Kitchen items have correct units');
    }

    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

completeDataCleanup();