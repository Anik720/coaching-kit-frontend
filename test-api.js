// script to query backend and figure out what the attendance api returns
const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:5000/staff-attendance');
        console.log("Response data:", JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
