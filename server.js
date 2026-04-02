console.log("Server file started ✅");

const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// HOME ROUTE
app.get("/", (req, res) => {
    console.log("HOME ROUTE HIT ✅");
    res.sendFile(__dirname + "/home.html");
});

// LOAD BOOKINGS
let bookings = [];

if (fs.existsSync("bookings.json")) {
    const data = fs.readFileSync("bookings.json");
    bookings = JSON.parse(data);
}

// BOOK SLOT API
app.post("/book-slot", (req, res) => {
    const { name, temple, time } = req.body;

    // Check duplicate booking
    const alreadyBooked = bookings.find(
        (b) => b.temple === temple && b.time === time && b.name === name
    );

    if (alreadyBooked) {
        return res.json({ message: "You already booked this slot ❌" });
    }

    // Limit 3 people per slot
    const slotCount = bookings.filter(
        (b) => b.temple === temple && b.time === time
    ).length;

    if (slotCount >= 3) {
        return res.json({ message: "Slot full ❌ Try another time" });
    }

    const ticketId = Math.random().toString(36).substr(2, 6).toUpperCase();

    bookings.push({ id: ticketId, name, temple, time });

    fs.writeFileSync("bookings.json", JSON.stringify(bookings, null, 2));

    res.json({
        message: "Slot booked successfully ✅",
        ticketId: ticketId
    });
});

// ✅ CROWD LEVEL API
app.get("/crowd-level", (req, res) => {
    const temple = req.query.temple;

    const count = bookings.filter(
        (b) => b.temple === temple
    ).length;

    let crowd = "Low 🟢";

    if (count > 3) crowd = "Medium 🟠";
    if (count > 6) crowd = "High 🔴";

    res.json({ crowd });
});

// ✅ CROWD DENSITY API
app.get("/crowd-density", (req, res) => {
    const { temple, time } = req.query;

    const count = bookings.filter(
        (b) => b.temple === temple && b.time === time
    ).length;

    const maxCapacity = 10;

    const percentage = (count / maxCapacity) * 100;

    res.json({
        count,
        percentage
    });
});

// GET ALL BOOKINGS
app.get("/bookings", (req, res) => {
    res.json(bookings);
});

// VERIFY TICKET
app.get("/verify", (req, res) => {
    const data = req.query.data;

    const [name, temple, time] = data.split("-");

    const found = bookings.find(
        (b) =>
            b.name === name &&
            b.temple === temple &&
            b.time === time
    );

    if (found) {
        res.send(`
            <h1 style="color:green;">✅ Valid Ticket</h1>
            <p>${name} | ${temple} | ${time}</p>
        `);
    } else {
        res.send(`
            <h1 style="color:red;">❌ Fake Ticket</h1>
        `);
    }
});

// START SERVER
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});