const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors({
  origin: [
      "http://localhost:5173",
      
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// verify token middleware creation 
const verifyToken = (req, res, next) =>{
  const token = req?.cookies?.token;

  if(!token){
      return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) =>{
      if(err){
          return res.status(401).send({message: 'unauthorized access'})
      }
      req.user = decoded;
      next();
  })
}


const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.rsv6fks.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//database collection creation
const database = client.db("blogDB");
const blogCollection = database.collection("allBlogs");
const wishlistCollection = database.collection("wishlist");
const userCollection = database.collection("users");
const commentCollection = database.collection("comments")

// json web token creation 

app.post('/jwt', async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1h' });
  res.cookie('token', token, {
      httpOnly: true,
      secure: false
  })
      .send({ success: true });
})

// clearing cookies when user logs out
app.post('/logout', async (req, res) => {
  const user = req.body;
  res.clearCookie('token', { maxAge: 0 }).send({ success: true })
})

// retrieves all blogs
app.get("/allblogs", async (req, res) => {
  try {
    const cursor = blogCollection.find();
    const allBlogs = await cursor.toArray();
    res.send(allBlogs);
  } catch (error) {
    console.log(error);
  }
});

// retrieve single blog details
app.get("/blogs/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const blog = await blogCollection.findOne(query);
    res.send(blog);
  } catch (error) {
    console.log(error);
  }
});

// retrieve recent 6 blogs
app.get("/recentblogs", async (req, res) => {
  try {
    const query = {};
    const options = {
      sort: { time: -1 },
    };
    const cursor = blogCollection.find(query, options);
    const result = (await cursor.toArray()).slice(0, 6);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// adding new blog by users
app.post("/addblog", verifyToken, async (req, res) => {
  try {
    const newBlog = req.body;
    const result = await blogCollection.insertOne(newBlog);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// retrieving blogs for featured list
app.get("/featured", async (req, res) => {
  try {
    const query = {};
    const cursor = blogCollection.find(query);
    const result = await cursor.toArray();
    const sortedArray = result.sort((a, b) => b.long.length - a.long.length);
    res.send(sortedArray.slice(0, 10));
  } catch (error) {
    console.log(error);
  }
});

// retrieving blogs from the wishlist
app.get("/wishlist", verifyToken, async (req, res) => {
  try {
    const query = {};
    const cursor = wishlistCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});
// removing blogs from the wishlist
app.delete("/wishlist/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const email = req.body.email;
    console.log(id, email);
    const query = { blogId: id, userEmail: email };
    const result = await wishlistCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// adding user to the database
app.get("/users", async (req, res) => {
  try {
    const query = {};
    const cursor = userCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});
app.post("/users", async (req, res) => {
  try {
    const newUser = req.body;
    const result = await userCollection.insertOne(newUser);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// adding blog to the wishlist
app.post("/wishlist", async (req, res) => {
  try {
    const newWish = req.body;
    const result = await wishlistCollection.insertOne(newWish);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// update blog by user
app.put("/updateblog/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const updatedBlog = req.body;
    const options = { upsert: false };
    const updateBlog = {
      $set: {
        title: updatedBlog.title,
        category: updatedBlog.category,
        short: updatedBlog.short,
        long: updatedBlog.long,
      },
    };
    const result = await blogCollection.updateOne(filter, updateBlog, options);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// adding comment to the database
app.post("/comments", async (req, res) => {
  try {
    const newComment = req.body;
    const result = await commentCollection.insertOne(newComment);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
})
//getting comments from the database
app.get("/comments/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { blogId: id};
    const cursor = commentCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
})



app.get("/", (req, res) => {
  res.send("server connected");
});

app.listen(port, () => {
  console.log(`server connected on ${port}`);
});
