import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

const url = process.env.DB_URI

const connection = async () => {
     await mongoose.connect(
      url,
      {
        useNewUrlParser: true,
        useUnifiedTopology:true     
      }
    )
}

mongoose.connection.on('connected', () => {
  console.log('connection mogoDB!');
})

mongoose.connection.on('error', (err) => {
  console.error('Error connecting to MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Disconnected from MongoDB');
}); 

export default connection