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
    todo: {
        type: String,
        unique: true
    },    
    destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Destination'
    }
})

const Destination = mongoose.model("Destination", destinationSchema)
const Checklist = mongoose.model("Checklist", checkListSchema)

app.get("/destination", async (req, res) => {
    const destinations = await Destination.find({}).sort("location")
    res.json(destinations);
  });

app.post("/destination/add", (req, res) => {
    const destination = req.body

    const newDestination = new Destination({
        location:  destination.location,
    })
    newDestination.save()
    .then(() => {
        res.sendStatus(200)
    })
    .catch(err => console.error(err))    
})

app.get ("/destination/:id", async(req, res) => {
    const destination = await Destination.findById(req.params.id)
    res.json(destination)
})

app.get("/destination/:id/checklist", async (req, res) => {
    const allTodos = await Checklist.find({ destination: req.params.id});
    res.json(allTodos);    
})

app.post("/destination/:id/checklist/add", (req, res) => {
    const checklist = req.body
    const destinationId = req.params.id

    Destination.findById(destinationId)
    .then(destination => {
        if (!destination) {
            return res.status(404).json({ message: "Destination not found"})
        }
        const newTodo = new Checklist({
            todo: checklist.todo,
            destination: destinationId
        })
        newTodo.save()
        .then(() => res.sendStatus(200))
        .catch(err => {
            console.error(err)
            res.sendStatus(500)
        })
    })
    .catch(err => {
        console.error(err)
        res.sendStatus(500)
    })
})

app.delete("/destination/:id", (req, res) => {
    Destination.deleteOne({"_id": req.params.id})
    .then(deletedDestination => {
        if (!deletedDestination) {
            return res.status(404).json({ message: "Destination not found" });            
        }
        return Checklist.deleteMany({ destination: req.params.id });
    })
    .then(() => {
        res.sendStatus(200)
    })
    .catch(err => {
        res.sendStatus(500)
    })    
})

app.delete("/destination/:id/checklist/:id", (req, res) => {
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