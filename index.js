const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.edgm8kl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const userCollection = client.db('Book').collection('user');
        const bookCollection = client.db('Book').collection('book');
        const categoriesCollection = client.db('Book').collection('categories');

        // Function to insert initial categories
        async function insertInitialCategories() {
            const categories = [
                { name: 'Fiction' },
                { name: 'Non-fiction' },
                { name: 'Mystery' },
                { name: 'Romance' },
                { name: 'Science fiction' },
                { name: 'Fantasy' },
                { name: 'Thriller' },
                { name: 'Historical fiction' },
                { name: 'Biography' },
                { name: 'Self-help' }
            ];
            await categoriesCollection.insertMany(categories);
        }

        // Insert initial categories (run once)
        const categoriesCount = await categoriesCollection.countDocuments();
        if (categoriesCount === 0) {
            await insertInitialCategories();
        }

        // User API
        app.post('/user', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.get('/user', async (req, res) => {
            try {
                const users = await userCollection.find().toArray();
                res.json(users);
            } catch (error) {
                console.error('Error fetching users:', error);
                res.status(500).json({ error: 'Failed to fetch users' });
            }
        });

        // Book API
        app.post('/book', async (req, res) => {
            const book = req.body;
            const result = await bookCollection.insertOne(book);
            res.send(result);
        });

        app.get('/books', async (req, res) => {
            try {
                const books = await bookCollection.find().toArray();
                res.json(books);
            } catch (error) {
                console.error('Error fetching books:', error);
                res.status(500).json({ error: 'Failed to fetch books' });
            }
        });

        app.delete('/books/:id', async (req, res) => {
            const id = req.params.id;
            const result = await bookCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result);
        });

        // Category API
        app.get('/categories', async (req, res) => {
            try {
                console.log('Fetching categories...');
                const categories = await categoriesCollection.find().toArray();
                console.log('Fetched categories:', categories);
                res.json(categories.map(category => category.name));
            } catch (error) {
                console.error('Error fetching categories:', error);
                res.status(500).json({ error: 'Failed to fetch categories' });
            }
        });

        // Fetch books by category
        app.get('/books/category/:category', async (req, res) => {
            const { category } = req.params;
            try {
                console.log(`Fetching books for category: ${category}`);
                const books = await bookCollection.find({ category }).toArray();
                console.log('Fetched books:', books);
                res.json(books);
            } catch (error) {
                console.error('Error fetching books by category:', error);
                res.status(500).json({ error: 'Failed to fetch books by category' });
            }
        });

        // Fetch book by ID
        app.get('/books/:id', async (req, res) => {
            const { id } = req.params;
            try {
                const book = await bookCollection.findOne({ _id: new ObjectId(id) });
                if (!book) {
                    return res.status(404).json({ error: 'Book not found' });
                }
                res.json(book);
            } catch (error) {
                console.error('Error fetching book details:', error);
                res.status(500).json({ error: 'Failed to fetch book details' });
            }
        });

        // Update book by ID
        app.put('/books/:id', async (req, res) => {
            const { id } = req.params;
            const updatedBook = req.body;

            try {
                const result = await bookCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedBook }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: 'Book not found' });
                }

                res.json({ message: 'Book updated successfully', book: updatedBook });
            } catch (error) {
                console.error('Error updating book:', error);
                res.status(500).json({ error: 'Failed to update book' });
            }
        });

        // Ping to confirm connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('server running');
});

app.listen(port, () => {
    console.log(`server is running on port: ${port}`);
});
