const commentsRouter = require("express").Router();
const Blog = require("../modals/blog");
const Comment = require("../modals/comment");

commentsRouter.get("/", async (request, response) => {
  const comments = await Comment.find({});
  response.json(comments);
});

commentsRouter.post("/", async (request, response) => {
  const body = request.body;
  const blog = (request.body = await Blog.findById(body.blog));

  const newComment = new Comment({
    content: body.content,
    blog,
  });

  const savedComment = await newComment.save();

  blog.comments = blog.comments.concat(savedComment._id);
  await blog.save();

  response.status(201).json(savedComment);
});

module.exports = commentsRouter;
