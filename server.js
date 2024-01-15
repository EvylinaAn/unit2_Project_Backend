import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";

const app = express();

app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});

mongoose.connect(process.env.DATABASE_URL);

app.get("/", (req, res) => {
  res.json({ message: "Server running - Project 2" });
});

const destinationSchema = new mongoose.Schema({
    location: String,
    // startDate: Date,
    // endDate: Date
})

const checkListSchema = new mongoose.Schema({
    todo: String,    
})

const Destination = mongoose.model("Destination", destinationSchema)
const Checklist = mongoose.model("Checklist", checkListSchema)

app.get("/destination", async (req, res) => {
    const destinations = await Destination.find({})
    res.json(destinations);
  });

app.get("/checklist", async (req, res) => {
    const allTodos = await Checklist.find({});
    res.json(allTodos);    
})

app.post("/destination/add", (req, res) => {
    const destination = req.body

    const newDestination = new Destination({
        location:  destination.location,
        // startDate: destination.startDate,
        // endDate: destination.endDate
    })
    newDestination.save()
    .then(() => {
        res.sendStatus(200)
    })
    .catch(err => console.error(err))    
})

app.post("/checklist/add", (req, res) => {
    const checklist = req.body

    const newTodo = new Checklist({
        todo: checklist.todo
    })
    newTodo.save()
    .then(() => {
        // console.log(`${checklist.todo} added to your Database`)
        res.sendStatus(200)
    })
    .catch(err => console.error(err))
})

app.delete("/destination/:id", (req, res) => {
    Destination.deleteOne({"_id": req.params.id})
    .then(() => {
        res.sendStatus(200)
    })
    .catch(err => {
        res.sendStatus(500)
    })    
})

app.delete("/checklist/:id", (req, res) => {
    Checklist.deleteOne({"_id": req.params.id})
    .then(() => {
        res.sendStatus(200)
    })
    .catch(err => {
        res.sendStatus(500)
    })
})

app.put("/destination/:id" , (req, res) => {
    Destination.updateOne(
        {_id: req.params.id},
        {location: req.body.location}
    )
    .then(() => {
        res.sendStatus(200)
    })
    .catch(() => {
        res.sendStatus(500)
    })
})

app.put("/checklist/:id" , (req, res) => {
    Checklist.updateOne(
        {_id: req.params.id},
        {todo: req.body.todo}
    )
    .then(() => {
        res.sendStatus(200)
    })
    .catch(() => {
        res.sendStatus(500)
    })
})