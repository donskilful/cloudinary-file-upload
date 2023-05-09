import express from "express";
import mongoose from "mongoose";
import path from "path";
import { pdfupload } from "./helper/multer.js";
import cloudinary from "./helper/cloudinary.js";

const app = express();

// MIDDLEWARES

// MODEL
const resumeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    trim: true,
    maxlength: [20, "Name cannot be more than 20 characters"],
  },
  file: {
    type: String,
    required: [true, "Please provide a file"],
  },
  created: { type: Date, default: Date.now },
});
const Resume = mongoose.model("Resume", resumeSchema);

// SET OPTIONS FOR DB CONNECTION
const option = {
  socketTimeoutMS: 30000,
  keepAlive: true,
};

// SET OPTIONAL STRICTQUERY TO AVOID TERMINAL WARNING
mongoose.set("strictQuery", false);

// SET DB CONNECTION STRING
const uri =
  "mongodb+srv://ydla:ydla@ydla.5pxhcii.mongodb.net/resume?retryWrites=true&w=majority";

// CONNECT TO DB
const connectDb = async () => {
  try {
    await mongoose.connect(uri, option);
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};
connectDb();

const PORT = 3000;

// ROUTES
app.get("/", async (req, res) => {
  try {
    return res
      .status(200)
      .json({ message: `Welcome to the resume upload api's` });
  } catch (error) {
    return res.status(500).json({ message: "Ops! somethingwent wrong", error });
  }
});

app.post("/resume", pdfupload.single("file"), async (req, res) => {
  try {
    const { name } = req.body;
    const file = req.file.path;

    const document = req.file;
    const result = await cloudinary.uploader.upload(document?.path);

    const resume = new Resume({
      name,
      file: result.secure_url,
    });

    await resume.save();
    return res
      .status(201)
      .json({ message: "Resume submitted successfully", data: resume });
  } catch (error) {
    return res.status(500).json({ message: "Ops! somethingwent wrong", error });
  }
});

app.get("/resumes", async (req, res) => {
  try {
    const resumes = await Resume.find();
    res.status(200).json({ message: "Resume", data: resumes });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Ops! somethingwent wrong", error });
  }
});

app.get("/resume/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const resume = await Resume.findById(id);
    if (!resume) {
      return res
        .status(400)
        .json({ message: `No resume matched the passed in Id ${id}` });
    }
    const file = resume.file;
    const filePath = path.join(__dirname, `../${file}`);
    return res
      .status(200)
      .json({ message: "Resume", data: { resume, file, filePath } })
      .download(filePath);
  } catch (error) {
    return res.status(500).json({ message: "Ops! somethingwent wrong", error });
  }
});

app.listen(PORT, () => console.log(`Resume server running on port ${PORT}`));
