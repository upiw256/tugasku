const mongoose = require('mongoose');
const { Schema } = mongoose;
const testSch = new Schema({
    k: { type: Schema.Types.Mixed }
});
const TestM = mongoose.model('Testquery', testSch);

mongoose.connect('mongodb://localhost:27017/tugasku')
.then(async () => {
    await TestM.deleteMany({});
    
    // Insert array
    await TestM.create({ k: ['X RPL 1', 'X RPL 2'] });
    // Insert string
    await TestM.create({ k: 'X RPL 1' });
    
    const singleQuery = await TestM.find({ k: 'X RPL 1' });
    console.log('find ( k: "X RPL 1" ) =>', singleQuery.length); 

    const inQuery = await TestM.find({ k: { $in: ['X RPL 1'] } });
    console.log('find ( k: { $in: ["X RPL 1"] } ) =>', inQuery.length);
    
    // Also simulate query from page.tsx:
    const queryList = await TestM.find({ 
        $or: [
          { k: 'X RPL 1' },
          { k: { $in: ['X RPL 1'] } }
        ]
    });
    console.log('find ( $or ) =>', queryList.length);

    process.exit(0);
});
