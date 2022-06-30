module.exports = {
   //When requested, information about the author of the note is allowed
   author: async (note, args, { models }) => {
      return await models.User.findById(note.author)
   },
   //When requested, information about the favoritedBy of the note is allowed
   favoritedBy: async (note, args, { models }) => {
      return await models.User.find({ _id: { $in: note.favoritedBy } })
   }
}