import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
// import checklist from "./models/checklist.js";

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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const checkListSchema = new mongoose.Schema({
  todo: String,
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Destination",
  },
});

const userSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
  },
  lastLogin: {
    type: Date,
    required: true,
  },
});

const Destination = mongoose.model("Destination", destinationSchema);
const Checklist = mongoose.model("Checklist", checkListSchema);
const User = mongoose.model("User", userSchema);

app.get("/user/login", async (req, res) => {
  const user = await User.find({});
  res.json(user);
});

app.get("/destination", async (req, res) => {
  const userEmail = req.headers["user-email"];
  const user = await User.findOne({ userEmail: userEmail });
  // console.log(user)

  if (user) {
    const destinations = await Destination.find({ user: user._id }).populate(
      "user"
    );
    res.json(destinations);
  } else {
    console.log("Not found");
    res.status(500).json({ message: "User not found" });
  }
});

// app.get("/destination", async (req, res) => {
//     const destinations = await Destination.find({}).sort("location")
//     res.json(destinations);
//   });

// app.post("/destination/add", async (req, res) => {
//     const userEmail = req.headers['user-email']
//     const user = await User.findOne({ "userEmail": userEmail })
//     console.log(user)
//     const destination = req.body

//     const newDestination = new Destination({
//         location:  destination.location,
//         user: user._id
//     })
//     newDestination.save()
//     .then(() => {
//         res.sendStatus(200)
//     })
//     .catch(err => console.error(err))
// })

app.post("/destination/add", async (req, res) => {
  const userEmail = req.headers["user-email"];
  const user = await User.findOne({ userEmail: userEmail });
  console.log(user);
  const destination = req.body;

  const packingList = ['Home Clothes', 'Footwear', 'Swimwear', 'Accessories', 'Coat', 'Socks', 'Hat', 'Spare bag', 'Sunglasses'];
  const toiletriesList = ['Toothbrush', 'Toothpaste', 'Facewash']

  const newDestination = new Destination({
    location: destination.location,
    user: user._id,
  });
  newDestination
    .save()
    .then((destination) => {
      Promise.all(
        packingList.map((item) =>
          new Checklist({
            todo: item,
            destination: destination._id,
          }).save()
        )
      )
      Promise.all(
        toiletriesList.map((item) =>
          new Checklist({
            todo: item,
            destination: destination._id,
          }).save()
        )
      )
      .then(() => {
        res.sendStatus(200);
      });
    })
    .catch((err) => console.error(err));
});

app.get("/destination/:id", async (req, res) => {
  const destination = await Destination.findById(req.params.id);
  res.json(destination);
});

app.get("/destination/:id/checklist", async (req, res) => {
  const allTodos = await Checklist.find({ destination: req.params.id });
  // res.json(checklist)
  res.json(allTodos);
});

app.post("/destination/:id/checklist/add", (req, res) => {
  const checklist = req.body;
  const destinationId = req.params.id;

  Destination.findById(destinationId)
    .then((destination) => {
      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }
      const newTodo = new Checklist({
        todo: checklist.todo,
        destination: destinationId,
      });
      newTodo
        .save()
        .then(() => res.sendStatus(200))
        .catch((err) => {
          console.error(err);
          res.sendStatus(500);
        });
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

app.delete("/destination/:id", (req, res) => {
  Destination.deleteOne({ _id: req.params.id })
    .then((deletedDestination) => {
      if (!deletedDestination) {
        return res.status(404).json({ message: "Destination not found" });
      }
      return Checklist.deleteMany({ destination: req.params.id });
    })
    .then(() => {
      res.sendStatus(200);
    })
    .catch((err) => {
      res.sendStatus(500);
    });
});

app.delete("/destination/:id/checklist/:id", (req, res) => {
  Checklist.deleteOne({ _id: req.params.id })
    .then(() => {
      res.sendStatus(200);
    })
    .catch((err) => {
      res.sendStatus(500);
    });
});

app.put("/destination/:id", (req, res) => {
  Destination.updateOne({ _id: req.params.id }, { location: req.body.location })
    .then(() => {
      res.sendStatus(200);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

app.put("/destination/:id/checklist/:id", (req, res) => {
  Checklist.updateOne({ _id: req.params.id }, { todo: req.body.todo })
    .then(() => {
      res.sendStatus(200);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

app.post("/user/login", async (req, res) => {
  const now = new Date();

  if ((await User.countDocuments({ userEmail: req.body.userEmail })) === 0) {
    const newUser = new User({
      userEmail: req.body.userEmail,
      lastLogin: now,
    });
    newUser
      .save()
      .then(() => {
        res.sendStatus(200);
      })
      .catch((err) => {
        res.sendStatus(500);
      });
  } else {
    await User.findOneAndUpdate(
      { userEmail: req.body.userEmail },
      { lastLogin: now }
    );
    res.sendStatus(200);
  }
});
