const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.rsv6fks.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);

const database = client.db("blogDB");
const blogCollection = database.collection("allBlogs");
const wishlistCollection = database.collection("wishlist")

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
app.get("/blogs/:id", async (req, res) => {
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
        sort: {time: -1}
    };
    const cursor = blogCollection.find(query,options);
    const result = (await cursor.toArray()).slice(0, 6);
    res.send(result)
  } catch (error) {
    console.log(error);
  }
});

// adding new blog by users
app.post("/addblog", async (req, res) => {
  try {
    const newBlog = req.body;
    const result = await blogCollection.insertOne(newBlog);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// retrieving blogs from the wishlist
app.get("/wishlist", async(req, res) => {
    try {
        const query = {};
        const cursor = wishlistCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
       } catch (error) {
         console.log(error);
       }
})
// removing blogs from the wishlist
app.delete("/wishlist/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const email = req.body.email;
        console.log(id, email)
        const query = {blogId: id, userEmail: email};
        const result = await wishlistCollection.deleteOne(query);
        res.send(result);
       } catch (error) {
         console.log(error);
       }
})

// adding blog to the wishlist 
app.post("/wishlist", async(req, res)=> {
    try {
       const newWish = req.body;
       const result = await wishlistCollection.insertOne(newWish);
       res.send(result);
      } catch (error) {
        console.log(error);
      }
})

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

app.get("/", (req, res) => {
  res.send("server connected");
});

app.listen(port, () => {
  console.log(`server connected on ${port}`);
});
