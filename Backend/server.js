const path = require('path');
// This forces Node to look in the exact folder where server.js lives
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Debug line - Now matching your database.js exactly!
console.log("Checking URI:", process.env.MONGO_URI ? "Found ✅" : "Missing ❌");

const app = require("./src/app");
const connectDB = require("./src/config/database");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server is running smoothly on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();