import  mongoose  from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },

    website: {
      type: String  
    },
    avatar: {
      type: String,
    },
    
    address : {
      country: {
        type: String
      },

      city: {
        type: String
      }

    },

    posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],
    role: {
      type: String,
      enum: ['admin', 'usuario'],
      default: 'usuario',
    },
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const User = mongoose.model('User', userSchema);

export default User