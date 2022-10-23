const dummy = (blogs) => {
  return 1
}


const totalLikes = (blogs) => {
  return blogs.map(b => b.likes).reduce((sum, current) => sum + current, 0)
}

const favoriteBlog = (blogs) => {
  let fav = blogs[0]
  blogs.forEach(b => {
    if (b.likes > fav.likes) {
      fav = b
    }
  })
  return fav
}

const mostBLogs = (blogs) => {
  const bloggers = []
  blogs.forEach(b => {
    const name = b.author
    let amount = blogs.filter(each => each.author === name).length
    const blogger = {
      author: name,
      blogs: amount
    }
    bloggers.push(blogger)
  })
  const topBlogger = () => {
    let top = bloggers[0]
    bloggers.forEach(b => {
      if (top.blogs < b.blogs) {
        top = b
      }
    })
    return top
  }
 return(topBlogger())

}

const mostLikes = (blogs) => {
  const authors = []
  blogs.forEach(b => {
    if (!authors.includes(b.author)) {
      authors.push(b.author)
    }
  })
  const likesCombined = []
  authors.map(a => {
    let blog = {
      author: a,
      likes: blogs
        .filter(each => each.author === a)
        .map(each => each.likes)
        .reduce((sum, current) => sum + current, 0)
    }
    likesCombined.push(blog)
  })
  let mostLikes = likesCombined[0]
  likesCombined.forEach(b => {
    if (b.likes > mostLikes.likes) {
      mostLikes = b
    }
  })
  return mostLikes
}


module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBLogs,
  mostLikes
}
