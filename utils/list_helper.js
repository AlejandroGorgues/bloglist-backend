var _ = require('lodash')

const dummy = (blogs) => {
    return 1
  }

const totalLikes = (array) =>{
    const reducer = (sum, item) =>{
        return sum + item
    }
    
    return array.length === 0
    ? 0
    : array.map(blog=> blog.likes).reduce(reducer, 0)
}

const favoriteBlog = (array) =>{
    const reducer = (fav, item) =>{
        return item.likes >= fav.likes ? item : fav
    }
    
    return array.length === 0
    ? 0
    : array.reduce(reducer, {likes:0})
}

const mostBlogs = (array) =>{
    return _.reduce(
        _.groupBy(array, 'author'),
        (max, group) => {
          return max.blogs >= totalBlogs ? max : { author: group[0].author, blogs: _.size(group) }
        },
        { author: '', blogs: 0 }
      )
}

const mostLikes= (array) =>{
    return _.reduce(
        _.groupBy(array, 'author'),
        (max, group) => {
          return max.likes >= totalLikes ? max : { author: group[0].author, likes: _.sumBy(group, 'likes') }
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