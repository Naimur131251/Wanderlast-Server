import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = 8000;

const client = new MongoClient(
  `mongodb+srv://${process.env.DB_URI}:${process.env.DB_PASS}@cluster0.kgxk25v.mongodb.net/`,
);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

app.use(cors());
app.use(express.json());

const mongoClient = await connectToMongoDB();
const db = mongoClient.db("wanderlast");
const destinationCollection = db.collection("destination");

// app.post("/add-destination", async (req, res) => {
//   const data = req.body;
//   const result = await destinationCollection.insertOne(data);
//   res.send(result);
// });

app.post("/add-destination", async (req, res) => {
  try {
    const data = req.body;

    // Check required fields
    if (!data.name?.trim() || !data.country?.trim()) {
      return res.status(400).json({
        message: "Destination name and country are required.",
      });
    }

    // Check duplicate destination
    const existingDestination = await destinationCollection.findOne({
      name: { $regex: `^${data.name.trim()}$`, $options: "i" },
      country: { $regex: `^${data.country.trim()}$`, $options: "i" },
    });

    if (existingDestination) {
      return res.status(409).json({
        message:
          "This destination already exists. Please choose another destination.",
      });
    }

    // Insert only if it does not exist
    const result = await destinationCollection.insertOne({
      ...data,
      name: data.name.trim(),
      country: data.country.trim(),
    });

    return res.status(201).json({
      message: "Destination added successfully!",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Add destination error:", error);

    return res.status(500).json({
      message: "Failed to add destination.",
    });
  }
});

app.get("/destinations", async (req, res) => {
  const result = await destinationCollection.find().toArray();
  res.send(result);
});

app.get("/featured-destinations", async (req, res) => {
  const result = await destinationCollection.find().limit(5).toArray();
  res.send(result);
});

app.get("/destination/:id", async (req, res) => {
  const { id } = req.params;
  const result = await destinationCollection.findOne({
    _id: new ObjectId(id),
  });
  res.send(result);
});

app.patch("/destination/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const result = await destinationCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: data },
  );
  res.json(result);
});

app.delete("/destination/:id", async (req, res) => {
  const { id } = req.params;
  const result = await destinationCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.json(result);
});

app.get("/", (req, res) => {
  res.send({ message: "Server is running fine!" });
});

app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});

export default app;
