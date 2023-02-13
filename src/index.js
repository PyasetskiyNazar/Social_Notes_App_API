require('dotenv').config()
const helmet = require('helmet')
const express = require('express')
const cors = require('cors')
const { ApolloServer } = require('apollo-server-express')
const jwt = require('jsonwebtoken')
const depthLimit = require('graphql-depth-limit')
const { createComplexityLimitRule } = require('graphql-validation-complexity')

// import of local modules
const db = require('./db')
const models = require('./models')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')


// We start the server on the port specified in the .env file, or on port 4000
const port = process.env.PORT || 4000;
const DB_HOST = process.env.DB_HOST


const app = express();
app.use(helmet())
app.use(cors())
db.connect(DB_HOST)



// get info about user from jwt
const getUser = token => {
  if (token) {
    try {
      // return user info from token
      console.log("token", token);
      console.log("process.env.JWT_SECRET", process.env.JWT_SECRET);


      return jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      new Error('Session invalid')
    }
  }
}

// setup Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
  context: ({ req }) => {
    // get user token from headers
    const token = req.headers.authorization;
    // trying to retrieve a user with a token
    const user = getUser(token)
    // display user info
    console.log(user);
    // add db and user models to context    
    return { models, user }
  }
})



// Apply the Apollo GraphQL middleware and specify the path to / api
server.applyMiddleware({ app, path: '/api' })

app.get('/', (req, res) => {
  res.send("APP IS RUNNING")
})

app.listen(port, () =>
  console.log(`Server running at http://localhost:${port}${server.graphqlPath}`)
);