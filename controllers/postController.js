import asyncHandler from 'express-async-handler'
import Post from '../models/postModel.js'

// Create a new post 
export const createPost = asyncHandler(async (req, res) => {
    const {title, content} = req.body

    if(!title || !content) {
        res.status(400)
        throw new Error('Both fields are required')
    }

    const post = await Post.create({
        title,
        content,
        author: req.user._id
    })
    res.status(201).json(post)
})


// Get all posts
export const getPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find().populate('author', 'name email')
    res.status(200).json(posts)
})

// Update a post
export const updatePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id)
    if(!post) {
        res.status(404).json({message: 'Post not found'})
    }

    if(post.author.toString() !== req.user._id.toString()) {
        res.status(404).json({message: 'Not authorized to update this post'})
    }

    post.title = req.body.title || post.title
    post.content = req.body.content || post.content

    const updatedPost = await post.save()
    res.json(updatedPost)
})

// Delete a post
export const deletePost = asyncHandler(async(req, res) => {
    const post = await Post.findById(req.params.id)
    if(!post){
        res.status(403).json({message: 'Not found'})
    }

    if(post.author.toString() !== req.user._id.toString()) {
        res.status(403).json({message: 'Not authorize to delete this post'})
    }

    await post.deleteOne()
    res.json({message: 'Post removed'})
})

// Like/unlike
export const toggleLike = asyncHandler(async(req, res)=>{
    const post = await Post.findById(req.params.id)

    if(!post) {
        res.status(404)
        throw new Error('Post not found')
    }

    if(post.likes.includes(req.user._id)){
        post.likes = post.likes.filter(
            (userId) => userId.toString() !== req.user._id.toString()
        );
    } else {
        post.likes.push(req.user._id)
    }
    await post.save()
    res.json({
        likesCount: post.likes.length,
        likesBy: post.likes
    })
})
