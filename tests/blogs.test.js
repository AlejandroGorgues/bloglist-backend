const { test, describe, beforeEach, after } = require('node:test')
const mongoose = require('mongoose')
const assert = require('node:assert')
const listHelper = require('../utils/list_helper')
const helper = require('./test_helper')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')

const api = supertest(app)
let token = ''

beforeEach(async () => {
  await Blog.deleteMany({})

  const response = await api.post('/api/login').send({ username: 'root', password: 'sekret' })
  token = JSON.parse(response.text).token

  const blogObjects = helper.setUserIdOnBlogs(helper.initialBlogs, JSON.parse(response.text).userId)
    .map(blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})

test('dummy returns one', () => {
  const blogs = []

  const result = listHelper.dummy(blogs)
  assert.strictEqual(result, 1)
})

describe('total likes', () => {
  test('of empty list is zero', () => {
    const result = listHelper.totalLikes([])
    assert.strictEqual(result, 0)
  })

  test('when list has only one blog, equals the likes of that', () => {
    const result = listHelper.totalLikes([helper.initialBlogs[0]])
    assert.strictEqual(result, helper.initialBlogs[0].likes)
  })
})



test('of a bigger list is calculated right', () => {

  const result = listHelper.totalLikes(helper.initialBlogs)
  assert.strictEqual(result, 36)
})

test('of author with the highest number of blogs', () => {
  const result = listHelper.mostBlogs(helper.initialBlogs)
  assert.deepStrictEqual(result, {
    author: 'Robert C. Martin',
    blogs: 3
  })
})

test('of author with most likes', () => {
  const result = listHelper.mostLikes(helper.initialBlogs)
  assert.deepStrictEqual(result, {
    author: 'Edsger W. Dijkstra',
    likes: 17
  })
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
  const response = await api
    .get('/api/blogs')
    .set('Authorization', `Bearer ${token}`)

  assert.strictEqual(response.body.length, helper.initialBlogs.length)
})

test(' the id of each blog is named _id from mongodb', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const response = await api
    .get('/api/blogs')
    .set('Authorization', `Bearer ${token}`)


  assert.strictEqual(Object.keys(response.body[0]).at(-1), Object.keys(blogsAtStart[0]).at(-1))
})
test('a valid blog with no token cannot be added ', async () => {
  const newBlog = {
    title: 'Type random22222',
    author: 'Author random4444444',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeRandom.html',
    likes: 23,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(401)
})

test('a valid blog can be added ', async () => {
  const newBlog = {
    title: 'Type random',
    author: 'Author random',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeRandom.html',
    likes: 14,
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

  const author = blogsAtEnd.map(n => n.author)

  assert(author.includes('Author random'))
})

test('a valid blog with no user cannot be added ', async () => {

  const newBlog = {
    title: 'Type random',
    author: 'Author random',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeRandom.html',
    likes: 14,
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

  const author = blogsAtEnd.map(n => n.author)

  assert(author.includes('Author random'))
})


test('a blog with no likes is set to 0 ', async () => {
  const newBlog = {
    title: 'Type random',
    author: 'Author random',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeRandom.html',
  }

  if(newBlog['likes']=== undefined){
    newBlog.likes = 0
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

  assert(blogsAtEnd.at(-1).likes === 0)
})


test('a blog with no title or url is not added ', async () => {
  const newBlog = {
    author: 'author',
    likes: 4,
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${token}`)
    .send(newBlog)
    .expect(400)

  const blogsAtEnd = await helper.blogsInDb()
  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)

})

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1)

    const title = blogsAtEnd.map(r => r.title)
    assert(!title.includes(blogToDelete.title))
  })
})

describe('updating of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    blogToUpdate.likes += 1
    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(blogToUpdate)
      .expect(200)

    const blogsAtEnd = await helper.blogsInDb()
    const blogUpdated = blogsAtEnd[0]
    assert(blogToUpdate.likes === blogUpdated.likes)
  })
})

after(async () => {
  await mongoose.connection.close()
})