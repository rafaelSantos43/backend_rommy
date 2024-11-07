import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },

    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true
    },

    author : {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },  
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const Comment = mongoose.model('Comment', commentSchema);

export default  Comment