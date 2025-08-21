import express from 'express'
import { createComment, getComments, deleteComment } from '../controllers/commentControllers.js'
import protect from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/:postId', protect, createComment)

router.get('/:postId', getComments)

router.delete('/:id', protect, deleteComment)


export default router