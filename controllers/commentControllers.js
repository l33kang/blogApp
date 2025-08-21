import asyncHandler from 'express-async-handler'
import Comment from '../models/commentModel.js'
import Post from '../models/postModel.js'

// Create a comment
export const createComment = asyncHandler(async(req, res) =>{
    const {content} = req.body
    const post =  await Post.findById(req.params.postId)

    if(!post) {
        res.status(404)
        throw new Error ('Post not found')
    }

    const comment = await Comment.create({
        content,
        author: req.user._id,
        post: req.params.postId
    })
    res.status(201).json({comment})
})

// Get a post comments
export const getComments = asyncHandler(async(req,res) => {
    const comments = await Comment.find({post: req.params.postId}).populate('author', 'name email').sort({createdAt: -1})
    res.json(comments)
})

// Delete a comment
export const deleteComment = asyncHandler(async(req,res)=> {
    const comment = await Comment.findById(req.params.id)

    if(!comment) {
        res.status(404)
        throw new Error('Comment not found')
    }

    if(comment.author.toString() !== req.user._id.toString()){
        res.status(403)
        throw new Error('Not authorized')
    }

    await comment.deleteOne()
    res.json({message: 'comment removed'})
})