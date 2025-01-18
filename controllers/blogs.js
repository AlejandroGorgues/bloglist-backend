const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)

})

blogsRouter.post('/', async (request, response, next) => {
  const body = request.body
  const user = request.user

  const blog = new Blog({
    title:body.title,
    author:body.author,
    url:body.url,
    likes:body.likes,
    user:user.id,
    comments: []
  })

  const savedBlog = await blog.save(blog.populate('user', {
    username: 1,
    name: 1,
  }))
  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()
  response.status(201).json(savedBlog)
})

blogsRouter.post('/:id/comments', async (request, response, next) => {
  const body = request.body
  const blog = await Blog.findById(request.params.id)
  const newComments = blog.comments.concat(body.comment)

  Blog.findByIdAndUpdate(request.params.id, { comments: newComments }, { new: true })
    .then(updatedBlog => {
      response.status(201).json(updatedBlog)
    })
    .catch(error => next(error))
})


blogsRouter.delete('/:id', async (request, response) => {
  const user = request.user
  const blog = await Blog.findById(request.params.id)
  if(blog.user.toString() === user.id)
    await Blog.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

blogsRouter.put('/:id', (request, response, next) => {
  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: body.user.id,
    comments: body.comments
  }

  Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    .then(updatedBlog => {
      response.json(updatedBlog)
    })
    .catch(error => next(error))
})

module.exports = blogsRouter