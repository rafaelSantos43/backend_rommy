import mongoose from "mongoose";
const postsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      //required: true,
    },
    content: {
      type: String,
      //required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    imageUrl: {
      type : String
    },
    commentCount : {
      type : Number,
      default:0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
const Posts = mongoose.model("Post", postsSchema);
export default Posts