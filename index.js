import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import data from "./data.js"

const app = express();
const port = 3000;

// Configuración de multer para almacenar imágenes en la memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Arreglo que almacenará las entradas del blog
const posts = [];
// Variable para mantener un seguimiento del último ID asignado a una entrada
let currentId = 0;

// Carga de datos iniciales desde el archivo data.js
data.forEach(item => {
    const info = {
        id: item.id,
        title: item.title,
        content: item.content,
    };
    // Se agrega la entrada al arreglo de posts
    posts.push(info);
    currentId++
});

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index.ejs", { posts: posts });
});

// Ruta POST para enviar una nueva entrada al blog
app.post("/submit", upload.single('post-image'), (req, res) => {
    const title = req.body["title"];
    const content = req.body["content"];
    const image = req.file;
    
    // Creación de una nueva entrada
    const blogEntry = {
        id: currentId++,
        title: title,
        content: content,
        image: image, 
    } 
    // Validación de título y contenido antes de agregar la entrada
    if(blogEntry.title && blogEntry.content){
        posts.push(blogEntry);
    }else {
        // Si la validación falla, se vuelve a renderizar la vista index.ejs
        res.render("index.ejs", { posts: posts });
    }
    // Se renderiza la vista index.ejs con las entradas actualizadas
    res.render("index.ejs", { posts: posts });
});

app.get("/post", (req, res) => {
    res.render("post.ejs");
});

// Ruta para editar una entrada específica
app.get("/edit/:id", (req, res) => {
    const postId = parseInt(req.params.id);
    // Buscar la entrada en el arreglo de posts
    const postToEdit = posts.find(post => post.id === postId);

    // Validación: si la entrada no se encuentra, se devuelve un error 404
    if (!postToEdit) {
        res.status(404).send("Post not found");
        return;
    }

    // Renderizar la vista edit.ejs con la entrada específica
    res.render("edit.ejs", { post: postToEdit });
});

// Ruta para ver detalles de una entrada específica
app.get("/read/:id", (req, res) => {
    const postId = parseInt(req.params.id);
    // Buscar la entrada en el arreglo de posts
    const postToRead = posts.find(post => post.id === postId);

    // Validación: si la entrada no se encuentra, se devuelve un error 404
    if (!postToRead) {
        res.status(404).send("Post not found");
        return;
    }
    // Renderizar la vista read.ejs con la entrada específica
    res.render("read.ejs", { post: postToRead });
});

// Ruta POST para editar una entrada específica
app.post("/edit/:id", upload.single('post-image'), (req, res) => {
    const postId = parseInt(req.params.id);
    // Encontrar el índice de la entrada a editar en el arreglo de posts
    const postToEditIndex = posts.findIndex(post => post.id === postId);

     // Validación: si la entrada no se encuentra, se devuelve un error 404
    if (postToEditIndex === -1) {
        res.status(404).send("Post not found");
        return;
    }

    // Creación de una entrada editada
    const editedPost = {
        id: postId,
        title: req.body.title,
        content: req.body.content,
        image: req.file || posts[postToEditIndex].image,
    };

    // Reemplazar la entrada antigua con la entrada editada en el arreglo de posts
    posts[postToEditIndex] = editedPost;
    res.redirect("/");
});




// Ruta para eliminar una entrada específica
app.get("/delete/:id", (req, res) => {
    const postId = parseInt(req.params.id);
    // Encontrar el índice de la entrada a eliminar en el arreglo de posts
    const postToDeleteIndex = posts.findIndex(post => post.id === postId);

    // Validación: si la entrada no se encuentra, se devuelve un error 404
    if (postToDeleteIndex === -1) {
        res.status(404).send("Post not found");
        return;
    }

    // Eliminar la entrada del arreglo de posts
    posts.splice(postToDeleteIndex, 1);

    res.redirect("/");
});

// delete


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
