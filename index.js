import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import moment from 'moment';
//import connection from './config.js';


const connection = process.env.BLOG_DB_CONNECTION;

if (!connection) {
    console.error("Error: La variable de entorno BLOG_DB_CONNECTION no está configurada.");
    process.exit(1); // Ends the process with a non-successful exit code (1).
}  

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del motor de plantillas EJS
app.set('view engine', 'ejs');
app.use(express.static("public"));

// Configuración para manejar la carga de archivos con multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb('Error: Solo se permiten imágenes (jpeg/jpg/png).');
    }
});

// Conexión a la base de datos
mongoose.connect(connection)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err.message);
    });

// Definición del modelo
const Post = mongoose.model('Post', {
    title: String,
    content: String,
    imagePath: String,
    date: { type: Date, default: Date.now },
}, 'info');

// Middleware para procesar datos de formularios
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Ruta principal que muestra las entradas de blog
app.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: 'desc' });
        const postsWithImagePath = posts.map(post => ({
            ...post.toObject(),
            imagePath: post.imagePath ? `/uploads/${path.basename(post.imagePath)}` : null,
        }));
        res.render('index', { posts: postsWithImagePath, moment });
    } catch (error) {
        console.error('Error fetching posts:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Ruta para mostrar la vista de lectura de una entrada
app.get('/read/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).send('Post not found');
        }
        res.render('read', { post, moment });
    } catch (error) {
        console.error('Error fetching post for reading:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Ruta para mostrar el formulario de creación de entrada
app.get('/post', (req, res) => {
    res.render('post');
});

// Ruta para procesar el formulario de creación de entrada
app.post('/post', upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const imagePath = req.file ? req.file.path : null;

        const newPost = new Post({ title, content, imagePath });
        await newPost.save();

        res.redirect('/');
    } catch (error) {
        console.error('Error creating post:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Ruta para mostrar un formulario de edición de entrada
app.get('/edit/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).send('Post not found');
        }
        res.render('edit', { post, moment });
    } catch (error) {
        console.error('Error fetching post for editing:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Ruta para procesar el formulario de edición de entrada
app.post('/edit/:id', upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { title, content, imagePath: req.file ? req.file.path : null, date: Date.now() },
            { new: true }
        );
        if (!updatedPost) {
            return res.status(404).send('Post not found');
        }
        res.redirect('/');
    } catch (error) {
        console.error('Error updating post:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Ruta para mostrar un formulario de eliminación de entrada
app.get('/delete/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).send('Post not found');
        }
        res.render('delete', { post, moment });
    } catch (error) {
        console.error('Error fetching post for deletion:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Ruta para procesar el formulario de eliminación de entrada
app.post('/delete/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        await Post.findByIdAndDelete(postId);
        res.redirect('/');
    } catch (error) {
        console.error('Error deleting post:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
