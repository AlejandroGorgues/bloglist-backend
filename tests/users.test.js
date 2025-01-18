const bcrypt = require('bcrypt')
const assert = require('node:assert')
const mongoose = require('mongoose')
const User = require('../models/user')
const { test, describe, beforeEach, after } = require('node:test')
const supertest = require('supertest')
const helper = require('./test_helper')

const app = require('../app')

const api = supertest(app)
let token = ''


describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('with wrong user length', async () => {

    const newUser = {
      username: 'ml',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }
    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
  })

  test('with wrong password length', async () => {

    const newUser = {
      username: 'mlaaa',
      name: 'Matti Luukkainen',
      password: 'sa',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
  })
})

describe('when there are more than one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash1 = await bcrypt.hash('sekret1', 10)
    const user1 = new User({ username: 'root1', passwordHash1 })

    await user1.save()

    const passwordHash2 = await bcrypt.hash('sekret2', 10)
    const user2 = new User({ username: 'root2', passwordHash2 })

    await user2.save()
    const response = await api.post('/api/login').send({ username: 'root1', password: 'sekret1' })
    // console.log(response.text)
    token = JSON.parse(response.text).token
  })

  test('get all users with no blogs', async () => {
    const currUsers = await helper.usersInDb()

    const response = await api
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)

    assert.strictEqual(JSON.parse(response.text).length, currUsers.length)
    assert.strictEqual(JSON.parse(response.text)[0].blogs.length, currUsers[0].blogs.length)
    assert.strictEqual(JSON.parse(response.text)[1].blogs.length, currUsers[1].blogs.length)
  })
})

after(async () => {
  await mongoose.connection.close()
})