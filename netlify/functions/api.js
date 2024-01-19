import "dotenv/config";
import express, { Router } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
// import checklist from "./models/checklist.js";
import serverless from 'serverless-http';

const api = express();

api.use(cors());
api.use(bodyParser.json());


mongoose.connect(process.env.DATABASE_URL);
const router = Router()

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

router.get("/", (req, res) => {
    res.json({ message: "Server running - Project 2" });
  });

router.get("/user/login", async (req, res) => {
  const user = await User.find({});
  res.json(user);
});

router.get("/destination", async (req, res) => {
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

// router.get("/destination", async (req, res) => {
//     const destinations = await Destination.find({}).sort("location")
//     res.json(destinations);
//   });

// router.post("/destination/add", async (req, res) => {
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

router.post("/destination/add", async (req, res) => {
  const userEmail = req.headers["user-email"];
  const user = await User.findOne({ userEmail: userEmail });
  console.log(user);
  const destination = req.body;

  const packingList = ['Home Clothes', 'Footwear', 'Swimwear', 'Accessories', 'Coat', 'Socks', 
  'Hat', 'Spare bag', 'Sunglasses', 'Toothbrush', 'Toothpaste', 'Face Wash', 'Personal Hygiene', 
  'Body Wash', 'Shampoo', 'Conditioner', 'Hairbrush', 'Medicine', 'Phone', 'Phone Charger', 
  'Laptop Charger', 'Camera', 'Camera Charger', 'Travel Adapter', 'Shaver/Straightener', 
  'Headphones/Earphones', 'Portable Charger', 'Wallet', 'Travel Money/Currency', 'Passport', 
  'Visa', 'License', 'Travel Insurance'];

const newDestination = new Destination({
  location: destination.location,
  user: user._id,
});

newDestination.save()
  .then((destination) => {
    return packingList.reduce((promiseChain, item) => {
      return promiseChain.then(() =>
        new Checklist({
          todo: item,
          destination: destination._id,
        }).save()
      );
    }, Promise.resolve());
  })
  .then(() => {
    res.sendStatus(200);
  })
  .catch((err) => console.error(err));
});

router.get("/destination/:id", async (req, res) => {
  const destination = await Destination.findById(req.params.id);
  res.json(destination);
});

router.get("/destination/:id/checklist", async (req, res) => {
  const allTodos = await Checklist.find({ destination: req.params.id });
  // res.json(checklist)
  res.json(allTodos);
});

router.post("/destination/:id/checklist/add", (req, res) => {
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

router.delete("/destination/:id", (req, res) => {
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

router.delete("/destination/:id/checklist/:id", (req, res) => {
  Checklist.deleteOne({ _id: req.params.id })
    .then(() => {
      res.sendStatus(200);
    })
    .catch((err) => {
      res.sendStatus(500);
    });
});

router.put("/destination/:id", (req, res) => {
  Destination.updateOne({ _id: req.params.id }, { location: req.body.location })
    .then(() => {
      res.sendStatus(200);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

router.put("/destination/:id/checklist/:id", (req, res) => {
  Checklist.updateOne({ _id: req.params.id }, { todo: req.body.todo })
    .then(() => {
      res.sendStatus(200);
    })
    .catch(() => {
      res.sendStatus(500);
    });
});

router.post("/user/login", async (req, res) => {
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


api.use("/api/", router)

export const handler = serverless(api)