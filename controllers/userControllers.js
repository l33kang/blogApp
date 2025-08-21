import asyncHandler from 'express-async-handler'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../models/userModel.js'


// Generate JWT token
const generateToken =(id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '48h'})
}

// Register user
export const registerUser = asyncHandler(async (req, res) => {
    const {name, email, password} = req.body

    if (!name || !email || !password) {
        res.status(400)
        throw new Error('All fields are required')
    }

    const userExists = await User.findOne({email})
    if (userExists) {
        res.status(400)
        throw new Error('User already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
        name,
        email,
        password: hashedPassword
    })
    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
            createdAt: user.createdAt
         })
    } else {
        res.status(400)
        throw new Error('Invalid user data')
    }
   
})

// Login user
export const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body

    if(!email || !password) {
        res.status(400)
        throw new Error('All fields are required')
    }

    const user = await User.findOne({email})

    if(user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user._id,
            name: user.name,
            token: generateToken(user._id),
            createdAt: user.createdAt
        })
    } else {
        res.status(401)
        throw new Error('Invalid email or password')
    }
})
export default {registerUser, loginUser}