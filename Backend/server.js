require("dotenv").config();
const app = require("./src/app"); // Added /src/
const connectToDB = require("./src/config/database"); // Added /src/

connectToDB();

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});