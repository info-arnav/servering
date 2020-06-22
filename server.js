const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { Redirect } = require("react-router-dom");
const bodyParser = require("body-parser");
const path = require("path");
const fileUpload = require("express-fileupload");

const serverNumber = process.env.PORT || "3000";
const serverPort = "http://localhost:4000";
const portNumber = "3000";
const reactPort = "http://localhost:3000";

const mongo = process.env.MONGODB_URI || "mongodb://localhost/cloud-blog";

const app = express();

app.listen(serverNumber);
app.use(express.static("public"));
app.use(cors());
app.use(fileUpload());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.connect(mongo);

//?user state
let extra = "";
let status = false;
let state = { status: status, email: "", password: "status" };
//!user schema

const user = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

user.pre("save", function (next) {
  const user = this;
  bcrypt.hash(user.password, 10, (error, hash) => {
    user.password = hash;
    next();
  });
});

const User = mongoose.model("user", user);

//!user data stores here

app.post("/user/store", async (req, res) => {
  let body = req.body;
  User.findOne({ email: body.email }, (error, value) => {
    if (value) {
      res.redirect(reactPort + "/login/the%20email%20is%20already%20taken");
    } else {
      User.create(body);
      res.redirect(reactPort + "/");
    }
  });
});

//? authoristation

app.post("/auth", async (req, res) => {
  let body = req.body;
  User.findOne({ email: body.email }, (error, user) => {
    if (user) {
      bcrypt.compare(body.password, user.password, (error, authorised) => {
        if (authorised) {
          res.redirect(reactPort + "/");
          status = true;
          state = {
            status: true,
            email: body.email,
            password: body.password,
          };
        } else {
          res.redirect(reactPort + "/login/the%20password%20is%20incorrect");
        }
      });
    } else {
      res.redirect(reactPort + "/login/the%20user%20id%20does%20not%20exist");
    }
  });
});

//!gallery

const picture = new mongoose.Schema({
  number: { type: String },
});

const Picture = mongoose.model("picture", picture);

app.post("/update/gallery", (req, res) => {
  Picture.create(req.body);
  res.redirect(reactPort + "/");
});

//!posts

let postNumber = "";

Picture.findOne({}, (error, value) => {
  if (value) {
    postNumber = value.number;
  } else {
    console.log("error");
  }
});

const post = new mongoose.Schema({
  name: String,
  email: String,
  title: String,
  message: String,
  image: String,
  date: { type: String, default: new Date() },
});

const Post = mongoose.model("post", post);

app.post("/post", async (req, res) => {
  let image = req.files.image;
  let body = req.body;
  await Picture.findOne({}, (error, value) => {
    if (value) {
      postNumber = value.number;
    } else {
      console.log("error");
    }
  });
  await Picture.updateOne(
    { number: postNumber },
    { $set: { number: `${parseInt(postNumber) + 1}` } }
  ).then((postNumber = (parseInt(postNumber) + 1).toString()));
  image.mv(
    path.resolve(
      __dirname,
      "public/public/assets/img/scenery",
      "image" + postNumber + ".jpg"
    ),
    async (error) => {
      await Post.create(body);
      await res.redirect("http://localhost:3000/");
      console.log(error);
    }
  );
});

//?fetch

app.get("/userid", (req, res) => {
  res.send(state.email);
});

app.get("/userstatus", (req, res) => {
  res.send(state.status);
});

app.get("/gallery", async (req, res) => {
  await Picture.findOne({}, (error, value) => {
    if (value) {
      postNumber = value.number;
    } else {
      console.log("error");
    }
  });
  res.send(postNumber);
});

app.get("/logout", (req, res) => {
  status = false;
  state = {
    status: false,
    email: "",
    password: "",
  };
  res.redirect(reactPort + "/");
});

app.get("/post/count", (req, res) => {
  res.send(postNumber);
});

app.get("/", (req, res) => {
  res.send(postNumber);
});

//comments

let comment = new mongoose.Schema({
  name: {
    type: String,
  },
  comment: {
    type: String,
  },
});

let Comment = mongoose.model("comment", comment);

app.post("/comment", (req, res) => {
  Comment.create(req.body);
  res.send(reactPort + "/");
});

app.get("/post/array", async (req, res) => {
  let postArray = [];
  postArray.title = [];
  postArray.message = [];
  let extra = [];
  await Post.find({}, (e, d) => {
    if (d) {
      d.map((e) => {
        postArray.push([e.message, e.date, e.name, e.title]);
      });
    } else {
      console.log("error");
    }
  });
  res.json(postArray);
});

let array = [];

app.get("/get/post/:id", async (req, res) => {
  await Post.findOne({ title: req.params.id }, (error, body) => {
    if (body) {
      array = [body.title, body.message, body.name, body.date];
      res.json(array);
    }
  });
});

//constact

const request = new mongoose.Schema({
  name: String,
  subject: String,
  email: String,
  message: String,
});

const Request = new mongoose.model("request", request);

app.post("/request", (req, res) => {
  Request.create(req.body);
  res.redirect(reactPort + "/");
});
