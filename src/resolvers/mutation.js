const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {
  AuthenticationError,
  ForbiddenError
} = require('apollo-server-express')
const mongoose = require('mongoose')
require('dotenv').config()

const gravatar = require('../util/gravatar')


module.exports = {
  newNote: async (parent, args, { models, user }) => {
    if (!user) {
      throw new AuthenticationError('You must be signed in to create a note')
    }
    return await models.Note.create({
      content: args.content,
      // we refer to mongo id author
      author: mongoose.Types.ObjectId(user.id)
    });
  },
  deleteNote: async (parent, { id }, { models, user }) => {
    if (!user) {
      throw new AuthenticationError('You must be signed in to delete a note')
    }
    //find note
    const note = await models.Note.findById(id)
    if (note && String(note.author) !== user.id) {
      throw new ForbiddenError('You don\'t have permissions to delete the note')
    }
    try {
      await note.remove()
      return true
    } catch (err) {
      return false
    }
  },
  updateNote: async (parent, { content, id }, { models, user }) => {
    if (!user) {
      throw new AuthenticationError('You must be signed in to delete a note')
    }
    //find note
    const note = await models.Note.findById(id)
    if (note && String(note.author) !== user.id) {
      throw new ForbiddenError('You don\'t have permissions to update the note')
    }
    // update noti in DB and return updated note
    return await models.Note.findOneAndUpdate(
      { _id: id },
      { $set: { content } },
      { new: true });
  },
  signUp: async (parent, { username, email, password }, { models }) => {
    // normalise email
    email = email.trim().toLowerCase()
    // Hashing password
    const hashed = await bcrypt.hash(password, 10)
    //create url gravatar-image
    const avatar = gravatar(email)
    try {
      const user = await models.User.create({
        username,
        email,
        avatar,
        password: hashed
      })
      // create and return json web token
      return jwt.sign({ id: user._id }, process.env.JWT_SECRET)
    } catch (error) {
      console.log(error);
      throw new Error('Error creating account')
    }
  },
  toggleFavorite: async (parent, { id }, { models, user }) => {
    // if no user context is passed, throw auth error
    if (!user) {
      throw new AuthenticationError()
    }

    // check to see if the user has already favorited the note
    let noteCheck = await models.Note.findById(id)
    const hasUser = noteCheck.favoritedBy.indexOf(user.id)

    // if the user exists in the list
    // pull them from the list and reduce the favoriteCount by 1
    if (hasUser >= 0) {
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $pull: {
            favoritedBy: mongoose.Types.ObjectId(user.id)
          },
          $inc: {
            favoriteCount: -1
          }
        },
        {
          // Set new to true to return the updated doc
          new: true
        }
      )
    } else {
      // if the user doesn't exists in the list
      // add them to the list and increment the favoriteCount by 1
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $push: {
            favoritedBy: mongoose.Types.ObjectId(user.id)
          },
          $inc: {
            favoriteCount: 1
          }
        },
        {
          new: true
        }
      )
    }
  },
  signIn: async (parent, { username, email, password }, { models }) => {
    if (email) {
      email = email.trim().toLowerCase()
    }
    const user = await models.User.findOne({
      $or: [{ email }, { username }]
    })
    // if user not founded send Authentication Error 
    if (!user) {
      throw new AuthenticationError('Error siging in')
    }
    // create and return json web token
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET)
  },

}