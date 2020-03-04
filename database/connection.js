import mongoose from 'mongoose';
import { connection } from 'mongoose'

const connectToDatabase = async () =>
  await mongoose.connect('mongodb+srv://'+process.env.user+':'+process.env.password+'@'+process.env.cluster+'/'+process.env.database+'?ssl=true&retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    autoIndex: false, // Don't build indexes
    poolSize: 10, // Maintain up to 10 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0,
    useNewUrlParser: true
  }) 

export { connectToDatabase, connection } 