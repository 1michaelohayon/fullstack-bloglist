const testingRouter = require('express').Router()
const Blog = require('../modals/blog')
const User = require('../modals/user')

testingRouter.post('/reset', async (request, response) => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  response.status(204).end()
})

module.exports = testingRouter