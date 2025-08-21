import mongoose from 'mongoose'

const connectDB = async () => {
    try{
        const connect = await mongoose.connect(process.env.CONNECTION_STRING)
        console.log(`MongoDB connected: ${connect.connection.name} at ${connect.connection.host}`)
    } catch (err) {
        console.log(`Erorr: ${err.message}`)
    }
}

export default connectDB