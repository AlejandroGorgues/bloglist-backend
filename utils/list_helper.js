var _ = require('lodash')

const dummy = () => {
  return 1
}

const totalLikes = (array) => {
  const reducer = (sum, item) => {
    return sum + item
  }
  console.log(array.length)
  return array.length === 0
    ? 0
    : array.map(blog => blog.likes).reduce(reducer, 0)
}

const favoriteBlog = (array) => {
  const reducer = (fav, item) => {
    return item.likes >= fav.likes ? item : fav
  }

  return array.length === 0
    ? 0
    : array.reduce(reducer, { likes:0 })
}

const mostBlogs = (array) => {
  return _.reduce(
    _.groupBy(array, 'author'),
    (max, group) => {
      const totalBlogs = _.size(group)
      return max.blogs >= totalBlogs ? max : { author: group[0].author, blogs: totalBlogs }
    },
    { author: '', blogs: 0 }
  )
}

const mostLikes= (array) => {
  return _.reduce(
    _.groupBy(array, 'author'),
    (max, group) => {
      const totalLikes = _.sumBy(group, 'likes')
      return max.likes >= totalLikes ? max : { author: group[0].author, likes: totalLikes }
    },
    { author: '', likes: 0 }
  )
}



module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}