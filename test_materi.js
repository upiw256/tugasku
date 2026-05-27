const mongoose = require('mongoose');
const { Materi } = require('./models/index.js');
const dbUri = process.env.MONGODB_URI;

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const materi = await Materi.find();
    console.log('Total materi:', materi.length);
    materi.forEach(m => console.log(m._id.toString(), m.judul));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
