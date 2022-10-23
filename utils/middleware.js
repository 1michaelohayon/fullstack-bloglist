const logger = require("./logger");
const morgan = require("morgan");
const User = require("../modals/user");
const jwt = require("jsonwebtoken");

const userExtractor = async (request, response, next) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    const token = authorization.substring(7);
    const decodedToken = jwt.verify(token, process.env.SECRET);
    request.user = await User.findById(decodedToken.id);
  } else {
    request.user = null;
  }
  next();
};

const morganLog = () => {
  morgan.token("body", (req) => JSON.stringify(req.body));
  return morgan(
    ":method :url :status :res[content-length] - :response-time ms :body"
  );
};

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (error, request, response, next) => {
  logger.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  } else if (error.name === "JsonWebTokenError") {
    return response.status(401).json({ error: "invalid token" });
  } else if (error.name === "TokenExpiredError") {
    return response.status(401).json({
      error: "token expired",
    });
  } else if (error.name === "TypeError") {
    return response.status(400).send({ error: "typeerror/malformatted id" });
  }
  next(error);
};

module.exports = {
  morganLog,
  userExtractor,
  unknownEndpoint,
  errorHandler,
};
