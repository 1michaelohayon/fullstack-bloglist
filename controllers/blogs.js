const blogsRouter = require("express").Router();
const Blog = require("../modals/blog");
const jwt = require("jsonwebtoken");

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({})
    .populate("user", {
      username: 1,
      name: 1,
      id: 1,
    })
    .populate("comments", {
      content: 1,
      id: 1,
    });
  response.json(blogs);
});

blogsRouter.get("/:id", async (request, response) => {
  const blog = await Blog.findById(request.params.id);
  blog ? response.json(blog) : response.status(404).end();
});

blogsRouter.post("/", async (request, response) => {
  const body = request.body;
  if (!body.title || !body.url) {
    return response.status(400).end();
  }

  if (!request.user) {
    return response.status(401).json({ error: "token is missing or invalid" });
  }

  const user = request.user;

  const newBlog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user,
  });

  const savedBlog = await newBlog.save();

  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  response.status(201).json(savedBlog);
});

blogsRouter.delete("/:id", async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: "token missing or invalid" });
  }
  const user = await request.user;

  const blog = await Blog.findById(request.params.id);
  blog === null;

  const blogOwner = blog.user.toString() === user._id.toString();

  if (!blogOwner) {
    return response.status(401).json({ error: "you do not own this blog" });
  }

  await Blog.findByIdAndRemove(request.params.id);

  user.blogs = user.blogs.filter((b) => b.toString() !== request.params.id);
  await user.save();

  response.status(204).end();
});

blogsRouter.put("/:id", async (request, response) => {
  const { title, author, url, likes } = request.body;

  const updatedNote = await Blog.findByIdAndUpdate(
    request.params.id,
    { title, author, url, likes },
    { new: true, runValidators: true, context: "query" }
  );
  response.json(updatedNote.toJSON());
});

module.exports = blogsRouter;
