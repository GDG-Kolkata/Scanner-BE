const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const logger = require("./logger");

const app = express();
const port = 4000;

// Whitelist the specific URL
const corsOptions = {
  origin: "https://gdgk-devfest24-scanner.vercel.app",
  optionsSuccessStatus: 200,
  preflightContinue: true,
  methods: 'GET, POST',
  preflightContinue: true,
  allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
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
  "mongodb+srv://souvik:abcd@cluster0.tsezq.mongodb.net/";
const client = new MongoClient(uri);

let db;
let collection;
async function connectDB() {
  try {
    await client.connect();
    db = client.db("PullDevfest2024Shortlisted");
    collection = db.collection("paidUsers1");
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1); // Exit the process if DB connection fails
  }
}

connectDB().then(() => {
  // Start the Express app only after the DB is connected
  app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.urlencoded({ extended: true }));

// Logging middleware to check headers
app.use((req, res, next) => {
  console.log("Request URL:", req.url);
  console.log("Request Origin:", req.headers.origin);
  res.setHeader('Access-Control-Allow-Origin', 'https://gdgk-devfest24-scanner.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


app.get("/", async (req, res) => {
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
    logger.info(`Attendee retrieved: ${attendeeId}`);
    res.status(200).json(attendee);
  } catch (error) {
    logger.error(`Error retrieving attendee: ${error.message}`);
    res.status(400).send(error.message);
  }
});

app.post("/attendee/:id", async (req, res) => {
  try {
    const attendeeId = req.params.id;
    if (req.body.requested_by) {
      requested_by = req.body.requested_by;
    }
    if (req.body.check_in) {
      check_in = req.body.check_in;
    }
    if (req.body.swag) {
      swag = req.body.swag;
    }
    if (req.body.food) {
      food = req.body.food;
    }

    if (!(check_in && food && swag) || !(food && (check_in || swag))) {
      logger.warn(
        `Invalid parameters for updating attendee ${attendeeId} requested by ${requested_by}`
      );
      return res
        .status(400)
        .send("Invalid parameters: food cannot be sent with check_in or swag");
    }

    if (!codes.includes(requested_by)) {
      logger.warn(`Volunteer not found ${requested_by}`);
      return res.status(400).send("Invalid requested_by code");
    }

    const attendee = await collection.findOne({
      _id: new ObjectId(attendeeId),
    });
    if (!attendee) {
      logger.warn(`Attendee not found: ${attendeeId}`);
      return res.status(400).send("Attendee not found");
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
      if (attendee.check_in && attendee.swag) {
        updateFields.food = food;
        updateFields.food_updatedAt = new Date();
        updateFields.food_updatedBy = requested_by;
      } else {
        return res
          .status(400)
          .send("Food can only be updated if check_in and swag are true");
      }
    }

    await collection.updateOne(
      { _id: new ObjectId(attendeeId) },
      { $set: updateFields }
    );
    logger.info(`Attendee updated: ${attendeeId}`);
    res.status(201).json(attendee);
  } catch (error) {
    logger.error(`Error updating attendee: ${error.message}`);
    res.status(500).send(error.message);
  }
});

app.get("/generate_session/", async (req, res) => {
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
    res.status(403).send(error.message);
  }
});

app.get("/getAllAttendees", async (req, res) => {
  try {
    // Ensure collection is defined and properly initialized
    if (!collection) {
      logger.error("Collection is not defined.");
      return res.status(500).send("Internal Server Error: Collection not defined");
    }
    const attendees = await collection.find().toArray();
    if (attendees.length === 0) {
      logger.warn("No attendees found.");
      return res.status(404).send("No attendees found");
    }
    res.status(200).json(attendees);
  } catch (error) {
    logger.error(`Error retrieving all attendees: ${error.message}`);
    return res.status(400).send(`Error retrieving all attendees: ${error.message}`);
  }
});


app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});
