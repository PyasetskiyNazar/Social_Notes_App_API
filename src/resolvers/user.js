module.exports = {
   //When requested, information about the author of the list notes is allowed
   notes: async (user, args, { models }) => {
      return await models.Note.find({ author: user._id }).sort({ _id: -1 })
   },
   //When requested, a list of favorite notes is allowed
   favorites: async (user, args, { models }) => {
      return await models.Note.find({ favoritedBy: user._id }).sort({ _id: -1 })
   }
}