module.exports = {

  port: process.env.PORT || 8080, // our port
  
  title: "PCPDash",
  
  pages: [
    //{title: 'Index', href:'/index'}, 
    //{title: 'Testing', href:'/test'},
    //{title: 'Fetch', href:'/fetch'}, 
    {title: 'Events', href:'/eventtypes'}, 
    {title: 'Heat Map', href:'/heatmap'},
    {title: 'Bar Chart', href:'/bar'},
    {title: 'Rainbow', href:'/arcs'},
    {title: 'File Systems', href:'/filesys'},
    {title: 'New', href:'/new'} 
  ]
}
