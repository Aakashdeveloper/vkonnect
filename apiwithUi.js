let express = require('express');
let app = express();
let dotenv = require('dotenv');
dotenv.config()
let mongo = require('mongodb')
let MongoClient = mongo.MongoClient;
let mongoUrl = process.env.mongourl;
let port = process.env.PORT || 8100;
let bodyParser = require('body-Parser')
let cors = require('cors');
let swaggerUi = require('swagger-ui-express');
let swaggerDocument = require('./swagger.json');
let package = require('./package.json');
let db;
let col_name = "users";

swaggerDocument.info.version = package.version;
app.use('/api-doc',swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// middleware
app.use(bodyParser.urlencoded({ extended:true}));
app.use(bodyParser.json());
app.use(cors());
app.set('views','./src/views')
app.set('view engine','ejs')

let authToken = "3e7dc81a58dff29f1d222db85e57da6e"

function auth(key){
    if(key == authToken){
        return true
    }else{
        return false
    }
}

app.get('/students',(req,res) => {
    let key = req.query.token
    if(auth(key)){
        db.collection(col_name).find({}).toArray((err,result) => {
            if(err) throw err;
            res.render('index',{data:result});
        })
    }else{
        res.send('Unauthenticated Requested')
    }
   
})

app.get('/',(req,res) => {
    res.status(200).render('forms')
})


//get users
app.get('/users',(req,res) => {
    let key = req.query.token
    if(auth(key)){
        let query = {}
        if(req.query.city && req.query.role){
            query ={city:req.query.city,role:req.query.role,isActive:true}
        }
        else if(req.query.city){
            query ={city:req.query.city,isActive:true}
        }else if(req.query.role){
            query ={role:req.query.role,isActive:true}
        }else if(req.query.isActive){
            let isActive = req.query.isActive
            if(isActive == "false"){
                isActive=false
            }else{
                isActive=true
            }
            query = {isActive}
        }
        db.collection(col_name).find(query).toArray((err,result) => {
            if(err) throw err;
            res.status(200).send(result)
        })
    }else{
        res.send('Unauthenticated Requested')
    }
})

//particular user
app.get('/user/:id',(req,res) => {
    let key = req.query.token
    if(auth(key)){
        let _id = mongo.ObjectId(req.params.id);
        db.collection(col_name).find({_id}).toArray((err,result) => {
            if(err) throw err;
            res.status(200).send(result)
        })
    }else{
        res.send('Unauthenticated Requested')
    }
})


//add users
app.post('/addUser',(req,res) => {
    let data = {
        name:req.body.name,
        city:req.body.city,
        phone:req.body.phone,
        role:req.body.role?req.body.role:'User',
        isActive:true
    }
    db.collection(col_name).insert(data,(err,result) => {
        if(err) throw err;
        //res.status(200).send('Data Added successfully')
        res.redirect('/')
    })
})

//update User
app.put('/updateUser',(req,res) => {
    let key = req.query.token
    if(auth(key)){
        db.collection(col_name).updateOne(
            {_id:mongo.ObjectId(req.body._id)},
            {
                $set:{
                    name:req.body.name,
                    city:req.body.city,
                    phone:req.body.phone,
                    role:req.body.role,
                    isActive:true
                }
            },(err,result) => {
                res.send('Data Updated')
            }
        )
    }else{
        res.send('Unauthenticated Requested')
    }
})

///delete user
app.delete('/deleteUser',(req,res) => {
    let key = req.query.token
    if(auth(key)){
        let _id = mongo.ObjectId(req.body._id);
        db.collection(col_name).remove({_id},(err,result) => {
            if(err) throw err;
            res.status(200).send('User Deleted')
        })
   }else{
        res.send('Unauthenticated Requested')
   }
})

//soft delete
app.put('/deactivateUser',(req,res) => {
    let key = req.query.token
    if(auth(key)){
        db.collection(col_name).updateOne(
            {_id:mongo.ObjectId(req.body._id)},
            {
                $set:{
                    isActive:false
                }
            },(err,result) => {
                res.send('User Deactivated')
            }
        )
    }else{
        res.send('Unauthenticated Requested')
    }
})


app.put('/activateUser',(req,res) => {
    let key = req.query.token
    if(auth(key)){
        db.collection(col_name).updateOne(
            {_id:mongo.ObjectId(req.body._id)},
            {
                $set:{
                    isActive:true
                }
            },(err,result) => {
                res.send('User Activated')
            }
        )
    }else{
        res.send('Unauthenticated Requested')
    }
})



MongoClient.connect(mongoUrl,(err,client)=>{
    console.log(mongoUrl)
    if(err) console.log(`Error While Connecting`);
    db = client.db('vkonnect');
    app.listen(port,() => {
        console.log(`Listing to port ${port}`)
    })
})
