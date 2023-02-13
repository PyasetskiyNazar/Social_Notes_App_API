
module.exports = {
   notes: async (parent, args, { models }) => {
      return await models.Note.find().limit(100)
   },
   note: async (parent, args, { models }) => {
      return await models.Note.findById(args.id)
   },
   user: async (parent, { username }, { models }) => {
      // find user by name
      return await models.User.findOne({ username })
   },
   users: async (parent, args, { models }) => {
      // find all users 
      return await models.User.find({})
   },
   me: async (parent, args, { models, user }) => {
      // find user by current user context
      return await models.User.findById(user.id)
   },
   noteFeed: async (parent, {cursor}, { models }) => {
      const limit = 10
      let hasNextPage = false

      //If the cursor is not passed, then the request will be empty by default.
      //In this case, the latest notes will be retrieved from the database      
      let cursorQuery = {}
      if (cursor) {
         cursorQuery = { _id: { $lt: cursor } }
      }
      // Find limit + 1 notes in the database, sorting them from old to new
      let notes = await models.Note.find(cursorQuery)
         .sort({ _id: -1 }).limit(limit + 1)
      // if the number of found notes exceeds the limit, set 
      // hasNextPage as true and trim the notes to the limit
      if (notes.length > limit) {
         hasNextPage = true
         notes = notes.slice(0, -1)
      }
      // the new cursor will be the ID of the Mongo object of the last element of the list array
      const newCursor = notes[notes.length - 1]._id      
      
      return {
         notes,
         cursor: newCursor,
         hasNextPage
      }
   }
}