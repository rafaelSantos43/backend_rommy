import mongoose from 'mongoose'
const likeListSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)
const LikeList = mongoose.model('LikeList', likeListSchema)
export default LikeList