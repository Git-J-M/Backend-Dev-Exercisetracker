const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')

mongoose.connect('mongodb+srv://martisjoey:1234hvhv1234HVP!@mongomongoose.xh8rx.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});


const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});



let Exercise = mongoose.model('Exercise', exerciseSchema);
let User = mongoose.model('User', userSchema);


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


app.post('/api/users', async (req, res) => {
  try {
    const user = new User({ username: req.body.username });
    await user.save();

    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id');
  res.json(users);
  });

app.post('/api/users/:_id/exercises', async (req, res) => {
  try{
    const userId = req.params._id;
    const { description ,duration, date}= req.body;
    const user = await User.findById({_id: userId});
    const exercise = new Exercise({
      userId: userId,
      description: description,
      duration: duration, 
      date: date ? new Date(date): new Date(),
    });
    await exercise.save();

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id,
    });
  }
  catch (err){
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { _id } = req.params;
    const { from, to, limit } = req.query;
    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let filter = { userId: _id.toString() };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    let exercisesQueries = Exercise.find(filter).select('description duration date -_id');
    if (limit) exercisesQueries = exercisesQueries.limit(Number(limit));

    const log = await exercisesQueries;
    
    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log: log.map(e => ({
        description: e.description,
        duration: e.duration,
        date: new Date(e.date).toDateString()
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
