const { test, describe, beforeEach, after } = require('node:test')
const mongoose = require('mongoose')
const assert = require('node:assert')
const helper = require('./test_helper')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')

const api = supertest(app)
let token = ''

beforeEach(async () => {
  await Blog.deleteMany({})

  const response = await api.post('/api/login').send({ username: 'root1', password: 'sekret1' })
  token = JSON.parse(response.text).token

  const blogObjects = helper.setUserIdOnBlogs(helper.initialBlogs, JSON.parse(response.text).userId)
    .map(blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})


test('first user from get contain all 6 blogs', async () => {
  const currUsers = await helper.usersInDb()

  const response = await api
    .get('/api/users')
    .set('Authorization', `Bearer ${token}`)

  assert.strictEqual(JSON.parse(response.text)[0].blogs.length, currUsers[0].blogs.length)
})

after(async () => {
  await mongoose.connection.close()
})