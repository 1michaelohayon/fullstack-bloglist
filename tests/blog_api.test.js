const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../modals/blog')
const User = require('../modals/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


beforeEach(async () => {
  await Blog.deleteMany({})
  const blogObjects = helper.initialBlogs
    .map(blog => new Blog(blog))
  const promisedArray = blogObjects.map(blog => blog.save())
  await Promise.all(promisedArray)
}, 100000)


describe(`get and retrival tests`, () => {
  test('HTTP GET request to the /api/blogs url', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
    expect(response.body).toHaveLength(helper.initialBlogs.length)
  }, 100000)

  test('verifies that "_id" is returned as "id"', async () => {
    const response = await api.get('/api/blogs')
    expect(response.body[0].id).toBeDefined()
  })

}, 100000)
describe('post/delete tests', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    token = await helper.logInToken(api) // creates new user, login, then returns his token
    HeaderToken = { 'Authorization': `bearer ${token}`, Accept: 'application/json' }
  }, 100000)

  test('HTTP POST request to the /api/blogs url successfully', async () => {
    const newBlog = {
      title: "haha what",
      author: "bestOne",
      url: "funnyquestion",
      likes: 14
    }


    await api
      .post('/api/blogs')
      .set(HeaderToken)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
    const titles = blogsAtEnd.map(b => b.title)
    expect(titles).toContain("haha what")
  })
  test('401 error when posting with missing/invalid token', async () => {
    const newBlog = {
      title: "haha what",
      author: "bestOne",
      url: "funnyquestion",
      likes: 14
    }


    const response = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    expect(response.body.error).toBe('token is missing or invalid')
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    
  })

  test('verifies that if the like property is missing, it will default to 0', async () => {
    const newBlog = {
      title: "no likes",
      author: "mosquito",
      url: "taktak",
    }


    const response = await api
      .post('/api/blogs')
      .send(newBlog)
      .set(HeaderToken)
      .expect(201)
      .expect('Content-Type', /application\/json/)
    expect(response.body.likes).toBeDefined()
    expect(response.body.likes).toBe(0)
  })

  test('missing url and title return 400 Bad Request', async () => {

    const newBlog = {
      author: "mosquito",
      likes: 70
    }
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

  })

  test('a blog can be deleted and responds 204 if id is valid', async () => {
    await Blog.deleteMany({})
    const decodedToken = jwt.verify(token, process.env.SECRET)
    const blogs = helper.initialBlogs.map(blog => ({ ...blog, user: decodedToken.id }))
    const blogObjects = blogs.map(blog => new Blog(blog))
    const promisedArray = blogObjects.map(blog => blog.save())
    await Promise.all(promisedArray)


    const blogsAtStart = await helper.blogsInDb()
    const firstBlog = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${firstBlog.id}`)
      .set(HeaderToken)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1)
  })
  test('can not delete other users blogs and errors 201 "you do not own this blog"', async () => {
    const wrongId = '1310ac23b0f5f911115e77dc'

    await Blog.deleteMany({})
    const blogs = helper.initialBlogs.map(blog => ({ ...blog, user: wrongId }))
    const blogObjects = blogs.map(blog => new Blog(blog))
    const promisedArray = blogObjects.map(blog => blog.save())
    await Promise.all(promisedArray)


    const blogsAtStart = await helper.blogsInDb()
    const firstBlog = blogsAtStart[0]

    const response = await api
      .delete(`/api/blogs/${firstBlog.id}`)
      .set(HeaderToken)
      .expect(401)

    expect(response.body.error).toBe('you do not own this blog')
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length)
  })
}, 100000)
describe('HTTP put tests', () => {
  test('can update entire blog', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const firstBlog = blogsAtStart[0]
    const body = {
      title: 'changed',
      author: 'Chameleon',
      likes: 55,
      url: "lol"
    }
    await api
      .put(`/api/blogs/${firstBlog.id}`)
      .send(body)
      .expect(200)

    const blogsAtEnd = await helper.blogsInDb()
    const changedBlog = blogsAtEnd.find(b => b.id === firstBlog.id)

    expect(changedBlog.title).toBe(body.title)
    expect(changedBlog.author).toBe(body.author)
    expect(changedBlog.likes).toBe(body.likes)
    expect(changedBlog.url).toBe(body.url)

  })
  test('can update specific element without changing the rest', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const firstBlog = blogsAtStart[0]
    const body = {
      title: 'changed',
      url: "lol"
    }

    await api
      .put(`/api/blogs/${firstBlog.id}`)
      .send(body)
      .expect(200)

    const blogsAtEnd = await helper.blogsInDb()
    const changedBlog = blogsAtEnd.find(b => b.id === firstBlog.id)

    expect(changedBlog.title).toBe(body.title)
    expect(changedBlog.url).toBe(body.url)

    expect(changedBlog.author).toBe(firstBlog.author)
    expect(changedBlog.likes).toBe(firstBlog.likes)


  })
  test('does not add elements outside the schema structure', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const firstBlog = blogsAtStart[0]
    const body = {
      title: 'changed',
      lol: "rofl",
      pizza: "pineapple"
    }
    await api
      .put(`/api/blogs/${firstBlog.id}`)
      .send(body)
      .expect(200)

    const blogsAtEnd = await helper.blogsInDb()
    const changedBlog = blogsAtEnd.find(b => b.id === firstBlog.id)
    expect(changedBlog.title).toBe(body.title)
    expect(changedBlog).not.toContain(body.lol)
    expect(changedBlog).not.toContain(body.pizza)
    expect(changedBlog.lol).toBe(undefined)
    expect(changedBlog.pizza).toBe(undefined)
  })
}, 100000)
describe('users tests', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a unique username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'testbot',
      name: 'tester bot',
      password: '10101010'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })
  test('creation fails with a duplicate username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'testbot',
      name: 'tester bot',
      password: '10101010'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const duplicateUser = newUser
    const response = await api
      .post('/api/users')
      .send(duplicateUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(response.body.error).toBe('username must be unique')
    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)


  })
  test('creation fails with a missing username', async () => {

    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: '',
      name: 'tester bot',
      password: '10101010'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(response.body.error).toContain('username` is required')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)

  })
  test('creation fails with a username under 3 characters long ', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'tw',
      name: 'tester bot',
      password: '10101010'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(response.body.error).toContain('is shorter than the minimum allowed length')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)

  })
  test('creation fails with a missing passowrd', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'testbot',
      name: 'tester bot',
      password: ''
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(response.body.error).toBe('missing password')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)

  })

  test('creation fails with a password under 3 characters long ', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'testbot',
      name: 'tester bot',
      password: '10'
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(response.body.error).toBe('password must be at least 3 characters long')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)

  })
}, 100000)

afterAll(() => {
  mongoose.connection.close()
})