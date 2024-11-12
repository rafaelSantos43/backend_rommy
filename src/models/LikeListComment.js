import mongoose from 'mongoose'
const likeListCommentSchema = new mongoose.Schema(
  {
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)
const LikeListComment = mongoose.model('LikeListComment', likeListCommentSchema)
export default LikeListComment