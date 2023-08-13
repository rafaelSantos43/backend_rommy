import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  filename: {
      type: String,
      required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  encoding: {
    type: String,
    required: true
  },
});

const Image = mongoose.model('Image', imageSchema);

export default Image
