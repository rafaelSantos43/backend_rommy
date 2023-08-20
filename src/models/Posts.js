import mongoose from "mongoose";

const postsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },

    author: {
      type: Object,
      ref: "User",
    },

    imageUrl: {
      type : String
    },

    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Posts = mongoose.model("Post", postsSchema);

export default Posts;
