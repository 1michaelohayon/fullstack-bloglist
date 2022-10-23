const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../modals/user')

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('blogs')
  response.json(users)
})

usersRouter.get('/:id', async (request, response) => {
  const user = await User.findById(request.params.id).populate('blogs')
  user
    ? response.json(user)
    : response.status(404).end()
})

usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body

  const existingUser = await User.findOne({ username })
  if (existingUser) {
    return response.status(400).json({ error: 'username must be unique' })
  } else if (request.body.password.length < 3) {
    if (request.body.password.length === 0) {
      return response.status(400).json({ error: 'missing password' })
    }
    return response.status(400).json({ error: 'password must be at least 3 characters long' })
  }


  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash,
  })

  const savedUser = await user.save()


  response.status(201).json(savedUser.toJSON())
})

module.exports = usersRouter
