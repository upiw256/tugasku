import mongoose from 'mongoose';
import { Materi } from './models/index.js';

await mongoose.connect('mongodb://localhost:27017/tugasku');
try {
  const materi = await Materi.findById('6a1692a0d5332e2bce3ccf24');
  console.log('Materi with findById:', materi);
} catch (e) {
  console.error(e);
}
process.exit(0);
