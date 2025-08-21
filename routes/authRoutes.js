import express from 'express'
import { registerUser, loginUser } from '../controllers/userControllers.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()


// Register route
router.post('/register', registerUser)

// Login route
router.post('/login', loginUser)

// Get user profile route
router.get('/profile', protect, (req, res) => {
    res.json(req.user)
})


// Logout route
router.post('/logout', (req, res) => {})



export default router