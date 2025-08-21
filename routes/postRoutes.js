import express from 'express'
import {createPost, getPosts, updatePost, deletePost, toggleLike} from '../controllers/postController.js'
import protect from '../middleware/authMiddleware.js'


const router = express.Router()

// Create a new post
router.post('/', protect, createPost)

// Get all posts
router.get('/', getPosts)

// Update a post
router.put('/:id', protect, updatePost)

// Delete a post
router.delete('/:id', protect, deletePost)

// Lie a post
router.patch('/:id/like', protect, toggleLike)

export default router
