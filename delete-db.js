// cat > delete-db.js << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');

async function deleteDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Drop the entire database
        await mongoose.connection.db.dropDatabase();
        console.log('✅ Database deleted successfully!');
        
        console.log('\n🎉 Database has been cleared!');
        console.log('Visit: http://localhost:3000/register to create admin\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

deleteDatabase();
// EOF