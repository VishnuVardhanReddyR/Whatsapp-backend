// importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1346169",
    key: "d2843809a266fd446028",
    secret: "bce8de847d76470d08e6",
    cluster: "eu",
    useTLS: true
  });

// middleware
app.use(express.json());
app.use(cors());

// app.use((req, res, next ) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Headers", "*");
//     next();
// });

// DB config
const connection_url = 'mongodb+srv://admin:VjiZxL0oNdmmP6n9@cluster0.abnwd.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(connection_url);

const db = mongoose.connection;

db.once('open', () => {
    console.log('DB connected');

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);

        if(change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', 
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });
        }else{
            console.log('error triggering Pusher');
        }
    });
});

// ????

// api routes
app.get('/',(req, res) => res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessages = req.body

    Messages.create(dbMessages, (err, data) => {
        if(err) {
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
        }
    })
})

// listen
app.listen(port, () => console.log(`Listening on localhost: ${port}`));