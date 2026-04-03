const path = require('path');
// This forces Node to look in the exact folder where server.js lives
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Debug line - this will tell us IMMEDIATELY if it's working
console.log("Checking URI:", process.env.MONGO_URI ? "Found ✅" : "Missing ❌");

const app = require("./src/app");
const connectDB = require("./src/config/database");

connectDB();

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});