import mongoose from 'mongoose'
const likeListSchema = new mongoose.Schema(
  {
    author: {
      type: new mongoose.Schema({
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        name: String,
      }),
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