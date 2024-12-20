const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const logger = require("./logger");

const app = express();
const port = 4000;

const allowedOrigins = [
  "https://gdgk-devfest24-scanner.vercel.app",
  "https://devfest.gdgkolkata.in",
  // "http://localhost:5173",
];

const corsOptions = {
  origin: "https://devfest.gdgkolkata.in",
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Origin",
  ],
};

const codes = {
  "pal.sarthaak@gmail.com": "832561",
  "shiwanisoni29082002@gmail.com": "520879",
  "anuragvermacontact@gmail.com": "685140",
  "rohitkumarabc68@gmail.com": "979472",
  "soumyarajbag@gmail.com": "690172",
  "pritamtan2001@gmail.com": "191966",
  "soumyaditya.dgp@gmail.com": "841319",
  "jitkumarsil16@gmail.com": "680622",
  "isharoy2006@gmail.com": "962178",
  "arupmatabber03@gmail.com": "782830",
  "prithasaha2722@gmail.com": "640041",
  "saumya18921@gmail.com": "989167",
  "souvikmicrobio@gmail.com": "628718",
  "ishikadas882@gmail.com": "397294",
  "sjha1172000@gmail.com": "139522",
  "swaps.b003@gmail.com": "387352",
  "iampaulsrijan@gmail.com": "402852",
  "heysubinoy@gmail.com": "992907",
  "ankana.001434@snuindia.in": "224232",
  "adityasingh.110601@gmail.com": "224858",
  "dibyataruchakraborty@gmail.com": "536489",
  "sanhatikundu02@gmail.com": "302698",
  "shourya.personal.999@gmail.com": "712312",
  "kunalnumbers@gmail.com": "688836",
  "john.doe@yopmail.com": "349201",
};

const uri =
  "mongodb+srv://souvik:abcd@cluster0.tsezq.mongodb.net/DevfestIA_dev";
const client = new MongoClient(uri);

let db;
let collection;
async function connectDB() {
  try {
    await client.connect();
    db = client.db("DevfestIA_dev");
    collection = db.collection("AttendeeDetails");
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1); // Exit the process if DB connection fails
  }
}

connectDB().then(() => {
  app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });
});

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Ensure JSON parsing for POST requests

// Middleware for setting headers and logging
app.use((req, res, next) => {
  console.log("Request URL:", req.url);
  console.log("Request Origin:", req.headers.origin);
  logger.info(`${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://gdgk-devfest24-scanner.vercel.app"
  );
  res.setHeader("Access-Control-Allow-Origin", "https://devfest.gdgkolkata.in");
  // res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/attendee/:id", async (req, res) => {
  try {
    const attendeeId = req.params.id;
    const attendee = await collection.findOne({
      _id: new ObjectId(attendeeId),
    });
    if (!attendee) {
      logger.warn(`Attendee not found: ${attendeeId}`);
      return res.status(404).send("Attendee not found");
    }
    res.status(200).json(attendee);
  } catch (error) {
    logger.error(`Error retrieving attendee: ${error.message}`);
    res.status(400).send(error.message);
  }
});

app.post("/attendee/:id", async (req, res) => {
  try {
    const attendeeId = req.params.id;
    const { requested_by, check_in, swag, food } = req.body;

    // Validate `requested_by`
    if (!Object.values(codes).includes(requested_by)) {
      logger.warn(`Invalid requested_by: ${requested_by}`);
      return res.status(400).send("Invalid requested_by code");
    }

    const attendee = await collection.findOne({
      _id: new ObjectId(attendeeId),
    });
    if (!attendee) {
      logger.warn(`Attendee not found: ${attendeeId}`);
      return res.status(404).send("Attendee not found");
    }

    // Validation rules
    if (food && !attendee.check_in) {
      return res
        .status(400)
        .send("Food can only be updated if check_in and swag are true");
    }

    const updateFields = {};
    if (check_in !== undefined) {
      updateFields.check_in = check_in;
      updateFields.check_in_updatedAt = new Date();
      updateFields.check_in_updatedBy = requested_by;
    }

    if (swag !== undefined) {
      updateFields.swag = swag;
      updateFields.swag_updatedAt = new Date();
      updateFields.swag_updatedBy = requested_by;
    }

    if (food !== undefined) {
      updateFields.food = food;
      updateFields.food_updatedAt = new Date();
      updateFields.food_updatedBy = requested_by;
    }

    await collection.updateOne(
      { _id: new ObjectId(attendeeId) },
      { $set: updateFields }
    );

    // const updatedAttendee = await collection.findOne({ _id: new ObjectId(attendeeId) });
    logger.info(`Attendee updated: ${attendeeId}`);
    return res.status(200).json({
      message: "Attendee updated successfully",
      ok: true,
    });
  } catch (error) {
    logger.error(`Error updating attendee: ${error.message}`);
    res.status(500).send(error.message);
  }
});

app.get("/generate_session", (req, res) => {
  try {
    const { email, code } = req.query;

    if (codes[email] && codes[email] === code) {
      logger.info(`Authorised: ${email}`);
      res.status(200).json({ authorised: true });
    } else {
      logger.warn(`Unauthorised: ${email}`);
      res.status(400).json({ authorised: false });
    }
  } catch (error) {
    logger.error(`Error generating session: ${error.message}`);
    res.status(500).send(error.message);
  }
});

app.get("/getAllAttendees", async (req, res) => {
  try {
    if (!collection) {
      logger.error("Collection is not defined.");
      return res
        .status(500)
        .send("Internal Server Error: Collection not defined");
    }
    const attendees = await collection.find().toArray();
    if (attendees.length === 0) {
      logger.warn("No attendees found.");
      return res.status(404).send("No attendees found");
    }
    res.status(200).json(attendees);
  } catch (error) {
    logger.error(`Error retrieving all attendees: ${error.message}`);
    res.status(500).send(error.message);
  }
});
