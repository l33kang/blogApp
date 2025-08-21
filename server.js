import express from 'express'
import dotenv from 'dotenv'
import db from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import postRoutes from './routes/postRoutes.js'
import commentRoutes from './routes/commentRoutes.js'
import path, {dirname} from 'path'
import { fileURLToPath } from 'url'

dotenv.config()
const app = express()


db();
const PORT = process.env.PORT || 3000

const __file = fileURLToPath(import.meta.url)
const __dirname = dirname(__file)
app.use(express.static(path.join(__dirname, './public')))
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public', 'index.html'))
})
 
// Middleware
app.use(express.json())
// Routes
app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)

app.listen(PORT, () => console.log(`Server is runing on port : ${PORT}`))